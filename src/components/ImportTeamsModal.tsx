import { useEffect, useState, type FormEvent } from 'react'
import { fetchJob, importTeams } from '../api/tournaments'
import {
  COLONNES_ATTENDUES,
  LETTRES,
  MAX_FICHIER_OCTETS,
  erreurDeMapping,
  fichierEnBase64,
  mappingParDefaut,
  mappingMemorise,
  memoriserMapping,
  resumeDuMapping,
  typeDeFichierPour,
} from '../lib/importColonnes'
import { jobTermine } from '../lib/telechargement'

/**
 * Import d'équipes depuis un fichier Excel, avec choix des colonnes.
 *
 * L'organisateur désigne où se trouve chaque donnée (« l'équipe est en colonne A,
 * le pseudo en C ») au lieu de devoir renommer les colonnes de son fichier pour
 * qu'elles portent les libellés attendus.
 *
 * Le traitement est asynchrone : le backend publie une demande, le worker Rust
 * lit le fichier, et la réponse crée les équipes et les joueurs. L'attente est
 * donc bornée et son avancement affiché — un import silencieux de plusieurs
 * secondes serait pris pour un bouton cassé.
 */
export function ImportTeamsModal({
  tournamentId,
  teamSize,
  tournoiDemarre,
  onClose,
  onImported,
}: {
  tournamentId: string
  teamSize: number | undefined
  /** Le bracket existe déjà : les équipes importées ne le rejoindront pas. */
  tournoiDemarre?: boolean
  onClose: () => void
  onImported: (message: string) => void
}) {
  const typeDeFichier = typeDeFichierPour(teamSize)
  const colonnes = COLONNES_ATTENDUES[typeDeFichier] ?? COLONNES_ATTENDUES.esport_5v5

  const [fichier, setFichier] = useState<File | null>(null)
  // Un organisateur importe souvent plusieurs fichiers de même forme : refaire le
  // mapping à chaque fois est une corvée évitable.
  const [mapping, setMapping] = useState<Record<string, string>>(
    () => mappingMemorise(typeDeFichier) ?? mappingParDefaut(colonnes),
  )
  const [avecEntete, setAvecEntete] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [etat, setEtat] = useState<string | null>(null)

  const probleme = erreurDeMapping(colonnes, mapping)

  // Échap ferme : un dialogue qui ne se ferme qu'au clic est pénible au clavier.
  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', auClavier)
    return () => window.removeEventListener('keydown', auClavier)
  }, [onClose])

  function choisirFichier(f: File | null) {
    setErreur(null)
    if (f && f.size > MAX_FICHIER_OCTETS) {
      // Même plafond que le backend : mieux vaut le dire ici que laisser partir
      // 12 Mo sur le réseau pour récupérer un refus.
      setFichier(null)
      setErreur(`Fichier trop volumineux (${Math.round(f.size / 1e6)} Mo). La limite est de 9 Mo.`)
      return
    }
    setFichier(f)
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault()
    if (!fichier) return setErreur('Choisis un fichier .xlsx.')
    if (probleme) return setErreur(probleme)

    setErreur(null)
    setEtat('Lecture du fichier…')
    try {
      const fileBase64 = await fichierEnBase64(fichier)
      setEtat('Traitement en cours…')
      let job = await importTeams({
        tournamentId,
        tournamentType: typeDeFichier,
        fileBase64,
        columns: mapping,
        hasHeader: avecEntete,
      })
      // Borne volontaire : un worker en panne ne doit pas laisser l'écran
      // tourner indéfiniment sans rien dire.
      for (let essai = 0; essai < 40 && !jobTermine(job.status); essai++) {
        await new Promise((r) => setTimeout(r, 1500))
        job = await fetchJob(job.id)
      }
      if (job.status === 'failed') throw new Error(job.error ?? 'Le traitement a échoué.')
      if (!jobTermine(job.status)) {
        throw new Error("L'import prend un temps inhabituel. Réessaie dans un instant.")
      }

      memoriserMapping(typeDeFichier, mapping)
      const equipes = Number(job.result?.team_count ?? 0)
      const joueurs = Number(job.result?.player_count ?? 0)
      onImported(`${equipes} équipe(s) et ${joueurs} joueur(s) importés.`)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Import impossible.')
    } finally {
      setEtat(null)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.55)',
        display: 'grid', placeItems: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <form
        className="card card-pad"
        style={{
          width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={envoyer}
      >
        <div>
          <div className="panel-title">Importer des équipes</div>
          <p className="page-sub" style={{ marginTop: 4 }}>
            Indique où se trouve chaque donnée dans ton fichier. Les libellés de tes
            colonnes n'ont pas d'importance.
          </p>
        </div>

        {tournoiDemarre && (
          <p className="field-hint" style={{ margin: 0 }}>
            ⚠️ Ce tournoi a déjà démarré. Les équipes importées seront inscrites mais
            <strong> ne rejoindront pas le bracket existant</strong>, qui ne se
            régénère pas tout seul.
          </p>
        )}

        <div className="field-group">
          <label className="field-label" htmlFor="import-fichier">Fichier Excel (.xlsx) *</label>
          <input
            id="import-fichier"
            className="input"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => choisirFichier(e.target.files?.[0] ?? null)}
          />
          {fichier && (
            <p className="field-hint">
              {fichier.name} — {(fichier.size / 1024).toFixed(0)} Ko
            </p>
          )}
        </div>

        <div className="field-group">
          <label className="field-label">Où se trouve chaque donnée ?</label>
          {colonnes.map((colonne) => (
            <div
              key={colonne}
              style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10, alignItems: 'center' }}
            >
              <span>{colonne}</span>
              <select
                className="input"
                aria-label={`Colonne pour ${colonne}`}
                value={mapping[colonne] ?? ''}
                onChange={(e) => {
                  setMapping((m) => ({ ...m, [colonne]: e.target.value }))
                  setErreur(null)
                }}
              >
                {LETTRES.map((lettre) => (
                  <option key={lettre} value={lettre}>Colonne {lettre}</option>
                ))}
              </select>
            </div>
          ))}
          {/* Récapitulatif en une phrase : c'est ce qui permet de vérifier son
              choix sans relire trois listes déroulantes. */}
          <p className={'field-hint' + (probleme ? ' is-error' : '')} style={{ marginTop: 4 }}>
            {probleme ?? resumeDuMapping(colonnes, mapping)}
          </p>
        </div>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={avecEntete}
            onChange={(e) => setAvecEntete(e.target.checked)}
          />
          <span>La première ligne contient les titres des colonnes</span>
        </label>
        {!avecEntete && (
          <p className="field-hint" style={{ marginTop: -8 }}>
            La première ligne sera lue comme une équipe. Décoche seulement si ton
            fichier commence directement par des données.
          </p>
        )}

        {erreur && <p className="field-hint is-error" style={{ margin: 0 }}>{erreur}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={etat !== null || !fichier || probleme !== null}
          >
            {etat ?? 'Importer'}
          </button>
        </div>
      </form>
    </div>
  )
}
