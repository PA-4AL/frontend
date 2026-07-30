import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { addTeamMember, createTeam, fetchMyTeams, removeTeamMember } from '../api/profile'
import type { Team } from '../api/types'
import { Shell } from '../components/Shell'
import { Avatar } from '../components/ui'
import { Display } from '../lib/display'
import { IconPlus, IconUserPlus, IconXCircle } from '../lib/icons'

const ROLE_LABELS: Record<string, string> = {
  captain: 'Capitaine',
  member: 'Membre',
  substitute: 'Remplaçant',
}

function TeamCard({
  team,
  isCaptain,
  onChanged,
}: {
  team: Team
  isCaptain: boolean
  onChanged: (t: Team) => void
}) {
  const [pseudo, setPseudo] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!pseudo.trim()) return
    setBusy(true)
    setError(null)
    try {
      onChanged(await addTeamMember(team.id, pseudo.trim(), role))
      setPseudo('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(memberId: string) {
    setBusy(true)
    setError(null)
    try {
      onChanged(await removeTeamMember(team.id, memberId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Avatar color={Display.colorFor(team.name.length)}>{Display.initials(team.name)}</Avatar>
        <div>
          <div className="panel-title">{team.name}</div>
          {team.tag && <span className="fmt-badge">[{team.tag}]</span>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {team.members.map((m) => (
          <div key={m.userId} className="info-row" style={{ padding: '8px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar color="var(--pa-primary)">{Display.initials(m.pseudo)}</Avatar>
              <span style={{ fontWeight: 600 }}>{m.pseudo}</span>
              <span className="fmt-badge">{ROLE_LABELS[m.role] ?? m.role}</span>
            </span>
            {isCaptain && m.role !== 'captain' && (
              <button
                className="btn btn-icon btn-ghost btn-h8"
                aria-label="Retirer"
                disabled={busy}
                onClick={() => remove(m.userId)}
              >
                <IconXCircle width={15} height={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isCaptain && (
        <form onSubmit={add} style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 140 }}
            placeholder="Pseudo du joueur…"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />
          <select className="input" style={{ width: 130 }} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">Membre</option>
            <option value="substitute">Remplaçant</option>
          </select>
          <button className="btn btn-outline" type="submit" disabled={busy || !pseudo.trim()}>
            <IconUserPlus />
            Ajouter
          </button>
        </form>
      )}
      {error && <p className="field-hint is-error" style={{ marginTop: 10 }}>{error}</p>}
    </div>
  )
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(() => {
    fetchMyTeams().then(setTeams).catch(() => setTeams([]))
  }, [])

  useEffect(reload, [reload])

  async function create(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setMessage(null)
    try {
      await createTeam(name.trim(), tag.trim() || undefined)
      setName('')
      setTag('')
      reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  /**
   * Le serveur tranche, car lui seul connaît l'identifiant interne de l'appelant.
   *
   * Cette fonction comparait les **pseudos** : deux homonymes se voyaient
   * mutuellement capitaines, et un changement de pseudo faisait perdre ses droits
   * d'affichage au vrai capitaine. Un pseudo n'est pas une identité.
   */
  function isCaptain(team: Team): boolean {
    return team.viewerIsCaptain === true
  }

  return (
    <Shell breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Équipes' }]}>
      <main className="app-content" style={{ maxWidth: 980, margin: '0 auto', width: '100%' }}>
        <div className="page-head">
          <div>
            <h1 className="page-title">Mes équipes</h1>
            <p className="page-sub">
              Crée ton groupe et gère son roster — tu peux avoir plusieurs équipes.
            </p>
          </div>
        </div>

        <form
          className="card card-pad"
          onSubmit={create}
          style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 18 }}
        >
          <div className="field-group" style={{ flex: 1, minWidth: 180 }}>
            <label className="field-label">Nom de l'équipe</label>
            <input className="input" placeholder="Team Nebula" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field-group" style={{ width: 120 }}>
            <label className="field-label">Tag</label>
            <input className="input" placeholder="NBL" maxLength={8} value={tag} onChange={(e) => setTag(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy || !name.trim()}>
            <IconPlus />
            Créer l'équipe
          </button>
          {message && <p className="field-hint is-error" style={{ width: '100%', margin: 0 }}>{message}</p>}
        </form>

        {teams.length === 0 ? (
          <div className="card placeholder-card">
            <div className="panel-title">Aucune équipe</div>
            <p>Crée ta première équipe ci-dessus — tu en seras le capitaine.</p>
          </div>
        ) : (
          <div className="col-gap">
            {teams.map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                isCaptain={isCaptain(t)}
                onChanged={(updated) => setTeams((ts) => ts.map((x) => (x.id === updated.id ? updated : x)))}
              />
            ))}
          </div>
        )}
        <div style={{ height: 30 }} />
      </main>
    </Shell>
  )
}
