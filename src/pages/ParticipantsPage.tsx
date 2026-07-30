import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  addParticipant,
  confirmRegistration,
  fetchParticipants,
  fetchTournament,
  fetchTournaments,
  registerTeamToTournament,
  registerToTournament,
  rejectRegistration,
  setSeed,
} from '../api/tournaments'
import { fetchMyTeams } from '../api/profile'
import { useAuth } from '../auth/AuthContext'
import { ImportTeamsModal } from '../components/ImportTeamsModal'
import type { Participant, RegistrationStatus, Team, TournamentDetail } from '../api/types'
import { Shell } from '../components/Shell'
import { Avatar } from '../components/ui'
import { IconUpload, IconUserPlus } from '../lib/icons'
import { Display } from '../lib/display'

const STATUS_LABELS: Record<RegistrationStatus, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmé', cls: 'sb-confirmed' },
  checked_in: { label: 'Check-in ✓', cls: 'sb-confirmed' },
  pending: { label: 'En attente', cls: 'sb-pending' },
  waitlist: { label: "Liste d'attente", cls: 'sb-pending' },
  withdrawn: { label: 'Désisté', cls: 'sb-withdrawn' },
  disqualified: { label: 'Disqualifié', cls: 'sb-disqualified' },
}

export function ParticipantsPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [importOuvert, setImportOuvert] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [newName, setNewName] = useState('')
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState('')

  const reload = useCallback(() => {
    fetchTournament(id).then(setTournament).catch(() => setTournament(null))
    fetchParticipants(id).then(setParticipants).catch(() => setParticipants([]))
  }, [id])

  useEffect(reload, [reload])

  useEffect(() => {
    fetchMyTeams()
      .then((teams) =>
        setMyTeams(
          teams.filter((t) =>
            t.members.some((m) => m.role === 'captain' && m.pseudo === user?.pseudo),
          ),
        ),
      )
      .catch(() => setMyTeams([]))
  }, [user?.pseudo])

  const isTeamTournament = (tournament?.teamSize ?? 1) > 1

  async function action(fn: () => Promise<unknown>) {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
      reload()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  const registrationsOpen =
    tournament && ['draft', 'registration', 'check_in'].includes(tournament.status)

  // Le classement n'existe qu'une fois le tournoi terminé : afficher une
  // colonne entièrement vide pendant le tournoi n'apporterait rien.
  const avecClassement = participants.some((p) => p.finalRank != null)

  return (
    <Shell
      breadcrumbs={[
        { label: 'Admin', to: '/' },
        { label: tournament?.name ?? 'Tournoi', to: `/tournois/${id}` },
        { label: 'Participants' },
      ]}
    >
      <main className="app-content" style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div className="page-head">
          <div>
            <h1 className="page-title">Participants</h1>
            <p className="page-sub">
              {tournament?.name} — {participants.filter((p) => p.status !== 'withdrawn').length}
              {tournament?.maxParticipants ? ` / ${tournament.maxParticipants}` : ''} inscrits
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Import Excel : hors du bloc conditionnel, donc visible même sur un
                tournoi démarré. Le masquer rendait le bouton introuvable sans
                expliquer pourquoi ; la boîte de dialogue avertit désormais que les
                équipes ne rejoindront pas un bracket déjà généré. */}
            <button
              className="btn btn-outline btn-h9"
              disabled={busy}
              onClick={() => setImportOuvert(true)}
            >
              <IconUpload />
              Importer un fichier
            </button>
          </div>
          {registrationsOpen && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ width: 220 }}
                placeholder="Pseudo ou nom d'équipe…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    e.preventDefault()
                    action(() => addParticipant(id, newName.trim()).then(() => setNewName('')))
                  }
                }}
              />
              <button
                className="btn btn-outline btn-h9"
                disabled={busy || !newName.trim()}
                onClick={() => action(() => addParticipant(id, newName.trim()).then(() => setNewName('')))}
              >
                <IconUserPlus />
                Ajouter
              </button>
              {isTeamTournament ? (
                <>
                  <select
                    className="input"
                    style={{ width: 180 }}
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                  >
                    <option value="">Mon équipe…</option>
                    {myTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.members.length})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-h9"
                    disabled={busy || !selectedTeam}
                    onClick={() => action(() => registerTeamToTournament(id, selectedTeam))}
                  >
                    Inscrire l'équipe
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary btn-h9"
                  disabled={busy}
                  onClick={() => action(() => registerToTournament(id))}
                >
                  S'inscrire moi-même
                </button>
              )}
            </div>
          )}
        </div>
        {registrationsOpen && (
          <p className="page-sub" style={{ marginTop: -16, marginBottom: 20 }}>
            Le seed définit la position dans le bracket (1 = en haut). Les participants sans seed
            sont placés aléatoirement à la génération.
          </p>
        )}

        {message && (
          <p className="field-hint is-error" style={{ marginBottom: 16 }}>{message}</p>
        )}

        <div className="card">
          <table className="t-list">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Seed</th>
                {/* Classement final : présent seulement s'il a été figé, pour ne pas
                    afficher une colonne de tirets sur un tournoi en cours. */}
                {avecClassement && <th>Classement</th>}
                <th>Statut</th>
                <th className="hide-sm">Inscrit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {participants.length === 0 && (
                <tr>
                  <td
                    colSpan={avecClassement ? 6 : 5}
                    style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}
                  >
                    Aucun participant pour l'instant.
                  </td>
                </tr>
              )}
              {participants.map((p, i) => {
                const s = STATUS_LABELS[p.status]
                return (
                  <tr key={p.registrationId} style={{ cursor: 'default' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar color={Display.colorFor(i)}>{Display.initials(p.name)}</Avatar>
                        <span className="t-name">{p.name}</span>
                      </div>
                    </td>
                    <td>
                      {registrationsOpen ? (
                        <input
                          className="input"
                          type="number"
                          min={1}
                          style={{ width: 70, height: 32 }}
                          defaultValue={p.seed ?? ''}
                          placeholder="—"
                          onBlur={(e) => {
                            const v = e.target.value === '' ? null : Number(e.target.value)
                            if (v !== p.seed) action(() => setSeed(p.registrationId, v))
                          }}
                        />
                      ) : (
                        <span className="t-num">{p.seed ?? '—'}</span>
                      )}
                    </td>
                    {avecClassement && (
                      <td>
                        {p.finalRank ? (
                          <span className="t-num" title={`${p.finalRank}e du tournoi`}>
                            {p.finalRank === 1 ? '🏆 1' : p.finalRank}
                          </span>
                        ) : (
                          <span className="t-meta">—</span>
                        )}
                      </td>
                    )}
                    <td>
                      <span className={`status-badge ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="hide-sm t-meta">{p.registeredLabel}</td>
                    <td style={{ textAlign: 'right' }}>
                      {(p.status === 'pending' || p.status === 'waitlist') && (
                        <button
                          className="btn btn-h8 btn-primary"
                          disabled={busy}
                          onClick={() => action(() => confirmRegistration(p.registrationId))}
                          style={{ marginRight: 8 }}
                        >
                          Valider
                        </button>
                      )}
                      {p.status !== 'withdrawn' && p.status !== 'disqualified' && (
                        <button
                          className="btn btn-h8 btn-outline"
                          disabled={busy}
                          onClick={() => action(() => rejectRegistration(p.registrationId))}
                        >
                          Retirer
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
      {importOuvert && (
        <ImportTeamsModal
          tournamentId={id}
          teamSize={tournament?.teamSize}
          tournoiDemarre={!registrationsOpen}
          onClose={() => setImportOuvert(false)}
          onImported={(resume) => {
            setImportOuvert(false)
            setMessage(resume)
            // Recharge : les équipes importées sont inscrites confirmées.
            reload()
          }}
        />
      )}

    </Shell>
  )
}

/** /participants (sidebar) → participants du premier tournoi actif. */
export function ParticipantsRedirect() {
  const [target, setTarget] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    fetchTournaments()
      .then((list) => {
        const featured = list.find((t) => t.status === 'ongoing' || t.status === 'registration') ?? list[0]
        setTarget(featured ? `/tournois/${featured.id}/participants` : null)
      })
      .catch(() => setTarget(null))
  }, [])

  if (target === undefined) return null
  if (target === null) {
    return (
      <Shell breadcrumbs={[{ label: 'Admin', to: '/' }, { label: 'Participants' }]}>
        <main className="app-content">
          <div className="card placeholder-card">
            <div className="panel-title">Participants</div>
            <p>Aucun tournoi — crée d'abord un tournoi.</p>
          </div>
        </main>
      </Shell>
    )
  }
  return <Navigate to={target} replace />
}
