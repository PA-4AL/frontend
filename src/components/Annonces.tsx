import { useEffect, useRef, useState } from 'react'
import { fetchMesAnnonces, marquerAnnoncesLues } from '../api/tournaments'
import { IconBell } from '../lib/icons'
import { config } from '../config'
import type { Annonce } from '../api/types'

/**
 * Cloche de notifications : les annonces des tournois où l'on est engagé.
 *
 * Le compteur vient du serveur, qui connaît la date de dernière consultation.
 * Le calculer côté client exigerait de mémoriser cette date par navigateur — et
 * le compteur repartirait à zéro d'un appareil à l'autre.
 *
 * Le rafraîchissement périodique complète la WebSocket de la page tournoi : celle-ci
 * ne couvre que le tournoi consulté, alors que la cloche agrège tous les siens.
 */
export function Annonces() {
  const [ouvert, setOuvert] = useState(false)
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [nonLues, setNonLues] = useState(0)

  async function charger() {
    try {
      const { annonces: liste, nonLues: n } = await fetchMesAnnonces()
      setAnnonces(liste)
      setNonLues(n)
    } catch {
      // Une cloche qui échoue ne doit pas gêner la navigation : on la laisse vide.
    }
  }

  useEffect(() => {
    // Premier chargement différé d'un tick : appeler `charger()` dans le corps de
    // l'effet déclencherait une mise à jour d'état pendant son exécution
    // synchrone, ce qui provoque un rendu en cascade (react-hooks).
    const premier = setTimeout(() => void charger(), 0)
    // Une minute : assez réactif pour une notification, assez rare pour ne pas
    // peser sur une base à 60 connexions.
    const battement = setInterval(() => void charger(), 60_000)
    return () => {
      clearTimeout(premier)
      clearInterval(battement)
    }
  }, [])

  async function basculer() {
    const prochain = !ouvert
    setOuvert(prochain)
    if (prochain && nonLues > 0) {
      // Marqué lu à l'ouverture, pas à la fermeture : le lecteur a vu la liste.
      setNonLues(0)
      try {
        await marquerAnnoncesLues()
      } catch {
        // Sans conséquence : le compteur se recalculera au prochain chargement.
      }
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="topnav-icon"
        aria-label={nonLues > 0 ? `Notifications (${nonLues} non lues)` : 'Notifications'}
        onClick={() => void basculer()}
      >
        <IconBell />
        {nonLues > 0 && (
          <span
            className="notif-dot"
            style={{
              minWidth: 16, height: 16, borderRadius: 8, display: 'grid', placeItems: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff', padding: '0 3px',
            }}
          >
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <>
          {/* Voile de fermeture : un panneau qui ne se ferme qu'en recliquant sur
              la cloche est une source d'agacement. */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOuvert(false)}
          />
          <div
            className="card"
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 41,
              width: 340, maxHeight: 420, overflowY: 'auto', padding: 8,
            }}
          >
            <div className="panel-title" style={{ padding: '8px 10px' }}>Notifications</div>
            {annonces.length === 0 && (
              <p className="t-meta" style={{ padding: '4px 10px 10px', margin: 0 }}>
                Rien pour l'instant. Les annonces de vos tournois apparaîtront ici.
              </p>
            )}
            {annonces.map((a) => (
              <div key={a.id} style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
                {/* Rendu en texte : le serveur n'envoie pas de balisage, et React
                    échappe ce qu'il affiche. */}
                <div>{a.message}</div>
                <div className="t-meta">{a.tournamentName} · {a.time}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Écoute les annonces d'un tournoi en direct.
 *
 * **Limite assumée** (ADR-0010) : Cloud Run répartit les connexions entre
 * plusieurs instances, une annonce peut donc ne pas arriver en direct. Le
 * rechargement de la liste à l'ouverture couvre ce cas — rien n'est perdu
 * durablement, seule l'instantanéité peut manquer.
 *
 * @param onAnnonce appelé à chaque annonce reçue
 */
export function useAnnoncesEnDirect(tournamentId: string | undefined, onAnnonce: (a: Annonce) => void) {
  // Référence plutôt que dépendance : le callback change à chaque rendu du
  // parent, et le mettre en dépendance rouvrirait la WebSocket en boucle.
  const rappel = useRef(onAnnonce)

  // L'affectation passe par un effet : écrire dans une ref pendant le rendu est
  // interdit (le rendu doit rester sans effet de bord).
  useEffect(() => {
    rappel.current = onAnnonce
  }, [onAnnonce])

  useEffect(() => {
    if (!tournamentId) return
    // `config.apiUrl` et non `import.meta.env` : la configuration de ce projet est
    // résolue au **runtime** (window.__APP_CONFIG__ écrit par le conteneur nginx).
    // En production, `VITE_API_URL` est vide et l'URL pointerait sur l'origine du
    // frontend — donc sur app. au lieu de api., et la connexion échouerait.
    const base = config.apiUrl || window.location.origin
    const url = base.replace(/^http/, 'ws') + `/ws/annonces?tournoi=${tournamentId}`

    let socket: WebSocket | null = null
    try {
      socket = new WebSocket(url)
    } catch {
      // Environnement sans WebSocket (test, navigateur restreint) : l'application
      // reste utilisable, seul le direct manque.
      return
    }
    socket.onmessage = (e) => {
      try {
        rappel.current(JSON.parse(String(e.data)) as Annonce)
      } catch {
        // Message illisible : ignoré plutôt que de casser la page.
      }
    }
    return () => socket?.close()
  }, [tournamentId])
}
