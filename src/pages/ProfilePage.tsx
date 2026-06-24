import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { addGameAccount, deleteGameAccount, fetchProfile, updateProfile } from '../api/profile'
import type { Profile, TournamentHistory } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Shell } from '../components/Shell'
import { Avatar } from '../components/ui'
import { useTheme } from '../lib/theme'
import { IconPlus, IconXCircle } from '../lib/icons'

/** Redimensionne l'image choisie en 160×160 et la retourne en data-URL JPEG. */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const size = 160
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      // recadrage carré centré
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible'))
    }
    img.src = url
  })
}

const RESULT_BADGES: Record<TournamentHistory['result'], { label: string; cls: string }> = {
  champion: { label: '🏆 Champion', cls: 'sb-confirmed' },
  in_progress: { label: 'En cours', cls: 'sb-live' },
  eliminated: { label: 'Éliminé', cls: 'sb-withdrawn' },
  registered: { label: 'Inscrit', cls: 'sb-pending' },
}

export function ProfilePage() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [game, setGame] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editingPseudo, setEditingPseudo] = useState(false)
  const [pseudoDraft, setPseudoDraft] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  async function savePseudo() {
    if (!pseudoDraft.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      setProfile(await updateProfile({ pseudo: pseudoDraft.trim() }))
      setEditingPseudo(false)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  async function changePhoto(file: File) {
    setBusy(true)
    setMessage(null)
    try {
      const avatarUrl = await resizeImage(file)
      setProfile(await updateProfile({ avatarUrl }))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  const reload = useCallback(() => {
    fetchProfile().then(setProfile).catch(() => setProfile(null))
  }, [])

  useEffect(reload, [reload])

  async function addAccount(e: FormEvent) {
    e.preventDefault()
    if (!game.trim() || !identifier.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await addGameAccount(game.trim(), identifier.trim())
      setGame('')
      setIdentifier('')
      reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  const stats = profile?.stats

  return (
    <Shell breadcrumbs={[{ label: 'Admin', to: '/' }, { label: 'Profil' }]}>
      <main className="app-content" style={{ maxWidth: 980, margin: '0 auto', width: '100%' }}>
        <div className="page-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              title="Changer ma photo"
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            >
              <Avatar color="var(--pa-accent)" size="xl" src={profile?.avatarUrl}>
                {user?.initials ?? '??'}
              </Avatar>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void changePhoto(f)
                e.target.value = ''
              }}
            />
            <div>
              {editingPseudo ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="input"
                    style={{ width: 220 }}
                    value={pseudoDraft}
                    autoFocus
                    onChange={(e) => setPseudoDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void savePseudo()
                      if (e.key === 'Escape') setEditingPseudo(false)
                    }}
                  />
                  <button className="btn btn-primary btn-h8" disabled={busy} onClick={savePseudo}>
                    OK
                  </button>
                  <button className="btn btn-ghost btn-h8" onClick={() => setEditingPseudo(false)}>
                    Annuler
                  </button>
                </div>
              ) : (
                <h1
                  className="page-title"
                  style={{ cursor: 'pointer' }}
                  title="Cliquer pour modifier le pseudo"
                  onClick={() => {
                    setPseudoDraft(profile?.pseudo ?? user?.pseudo ?? '')
                    setEditingPseudo(true)
                  }}
                >
                  {profile?.pseudo ?? user?.pseudo} ✎
                </h1>
              )}
              <p className="page-sub">
                {profile?.email || 'email non renseigné'} — clique sur la photo pour la changer
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label className="checkbox" style={{ gap: 10 }}>
              <button
                type="button"
                className={'switch' + (dark ? ' is-on' : '')}
                onClick={toggle}
                aria-label="Thème sombre"
              >
                <span className="thumb" />
              </button>
              Thème sombre
            </label>
            <button className="btn btn-outline" onClick={logout}>
              Se déconnecter
            </button>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="card kpi">
            <div className="k-label">Tournois joués</div>
            <div className="k-value">{stats?.tournamentsPlayed ?? '—'}</div>
          </div>
          <div className="card kpi">
            <div className="k-label">Matchs joués</div>
            <div className="k-value">{stats?.matchesPlayed ?? '—'}</div>
          </div>
          <div className="card kpi">
            <div className="k-label">Victoires</div>
            <div className="k-value">{stats?.matchesWon ?? '—'}</div>
          </div>
          <div className="card kpi">
            <div className="k-label">Winrate</div>
            <div className="k-value" style={{ color: 'var(--pa-live-dark)' }}>
              {stats ? `${stats.winrate}%` : '—'}
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="panel-head">
              <span className="panel-title">Historique des tournois</span>
            </div>
            <table className="t-list">
              <thead>
                <tr>
                  <th>Tournoi</th>
                  <th>Jeu</th>
                  <th className="hide-sm">Matchs</th>
                  <th>Résultat</th>
                </tr>
              </thead>
              <tbody>
                {(profile?.history ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
                      Aucun tournoi joué pour l'instant.
                    </td>
                  </tr>
                )}
                {(profile?.history ?? []).map((h) => {
                  const badge = RESULT_BADGES[h.result]
                  return (
                    <tr key={h.tournamentId} style={{ cursor: 'default' }}>
                      <td>
                        <Link to={`/tournois/${h.tournamentId}`} className="btn-link" style={{ fontSize: 14 }}>
                          {h.name}
                        </Link>
                      </td>
                      <td className="t-meta">{h.game}</td>
                      <td className="hide-sm t-num">
                        {h.matchesWon} / {h.matchesPlayed}
                      </td>
                      <td>
                        <span className={`status-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card card-pad">
            <div className="panel-title" style={{ marginBottom: 6 }}>Identifiants in-game</div>
            <p className="page-sub" style={{ marginBottom: 16 }}>
              Riot ID, Battletag… visibles par les organisateurs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {(profile?.gameAccounts ?? []).map((a) => (
                <div
                  key={a.id}
                  className="info-row"
                  style={{ borderBottom: 'none', padding: '8px 12px', background: 'var(--muted)', borderRadius: 'var(--radius-md)' }}
                >
                  <span>
                    <b>{a.game}</b>
                    <span className="t-meta" style={{ marginLeft: 8 }}>{a.identifier}</span>
                  </span>
                  <button
                    className="btn btn-icon btn-ghost btn-h8"
                    aria-label="Supprimer"
                    onClick={() => {
                      deleteGameAccount(a.id).then(reload).catch(() => undefined)
                    }}
                  >
                    <IconXCircle width={15} height={15} />
                  </button>
                </div>
              ))}
              {(profile?.gameAccounts ?? []).length === 0 && (
                <p className="t-meta">Aucun identifiant enregistré.</p>
              )}
            </div>

            <form onSubmit={addAccount} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="input"
                placeholder="Jeu (ex : Valorant)"
                value={game}
                onChange={(e) => setGame(e.target.value)}
              />
              <input
                className="input"
                placeholder="Identifiant (ex : Pseudo#EUW)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              {message && <p className="field-hint is-error" style={{ margin: 0 }}>{message}</p>}
              <button className="btn btn-outline" type="submit" disabled={busy}>
                <IconPlus />
                Ajouter
              </button>
            </form>
          </div>
        </div>
        <div style={{ height: 30 }} />
      </main>
    </Shell>
  )
}
