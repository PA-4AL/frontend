import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchTournament, generateBracket, registerToTournament } from '../api/tournaments'
import type { MatchRow, TournamentDetail } from '../api/types'
import { Shell } from '../components/Shell'
import { Avatar, FmtBadge, StatusBadge, FORMAT_LABELS } from '../components/ui'
import {
  IconBracket,
  IconEdit,
  IconFlag,
  IconMore,
  IconPanel,
  IconXCircle,
} from '../lib/icons'

function MatchLine({ m }: { m: MatchRow }) {
  const score = (v: number | null, win: boolean) =>
    v === null ? (
      <span className="mr-score" style={{ color: 'var(--muted-foreground)' }}>
        —
      </span>
    ) : (
      <span className={'mr-score ' + (win ? 'mr-win' : 'mr-lose')}>{v}</span>
    )

  return (
    <div className="match-row">
      <div className="mr-team">
        <Avatar color={m.teamA.color}>{m.teamA.code}</Avatar>
        <span className="nm">{m.teamA.name}</span>
      </div>
      <div>{score(m.scoreA, (m.scoreA ?? 0) >= (m.scoreB ?? 0))}</div>
      {m.status === 'live' ? (
        <span className="status-badge sb-live" style={{ flex: 'none' }}>
          <span className="dot live" />
          Live
        </span>
      ) : m.status === 'done' ? (
        <span className="status-badge sb-finished" style={{ flex: 'none' }}>
          Done
        </span>
      ) : (
        <span className="status-badge sb-upcoming" style={{ flex: 'none' }}>
          <span className="dot" style={{ background: 'var(--status-warning)' }} />
          {m.time}
        </span>
      )}
      <div>{score(m.scoreB, (m.scoreB ?? 0) > (m.scoreA ?? 0))}</div>
      <div className="mr-team right">
        <Avatar color={m.teamB.color}>{m.teamB.code}</Avatar>
        <span className="nm">{m.teamB.name}</span>
      </div>
    </div>
  )
}

export function TournamentDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [t, setT] = useState<TournamentDetail | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(() => {
    fetchTournament(id).then(setT).catch(() => setT(null))
  }, [id])

  useEffect(reload, [reload])

  async function action(fn: () => Promise<unknown>, then?: () => void) {
    setBusy(true)
    setMessage(null)
    try {
      await fn()
      reload()
      then?.()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur.')
    } finally {
      setBusy(false)
    }
  }

  if (!t) return null

  const registrationsOpen = ['draft', 'registration', 'check_in'].includes(t.status)

  const progress = t.matchesTotal > 0 ? Math.round((t.matchesPlayed / t.matchesTotal) * 100) : 0
  const shownTeams = t.remainingTeams.slice(0, 3)
  const moreTeams = t.remainingTeams.length - shownTeams.length

  return (
    <Shell
      breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Tournois' }, { label: t.name }]}
    >
      <main className="app-content" style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <section className="hero">
          <div className="hero-top">
            <StatusBadge status={t.status} />
            <FmtBadge format={t.format} />
            <FmtBadge label={`${t.maxParticipants} équipes`} />
          </div>
          <h1>{t.name}</h1>
          <div className="hero-meta">
            <div className="hm">
              <div className="l">Cash prize</div>
              <div className="v" style={{ color: 'var(--pa-live)' }}>
                {t.cashPrize}
              </div>
            </div>
            <div className="hm">
              <div className="l">Phase</div>
              <div className="v">{t.currentPhaseLabel}</div>
            </div>
            <div className="hm">
              <div className="l">Démarré</div>
              <div className="v">{t.startedLabel}</div>
            </div>
            <div className="hm">
              <div className="l">Participants</div>
              <div className="v">
                {t.participants} / {t.maxParticipants}
              </div>
            </div>
            <div className="hm">
              <div className="l">Équipes restantes</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <div className="avatar-group">
                  {shownTeams.map((team) => (
                    <Avatar key={team.code} color={team.color} style={{ boxShadow: '0 0 0 2px #141633' }}>
                      {team.code}
                    </Avatar>
                  ))}
                  {moreTeams > 0 && (
                    <span className="more" style={{ width: 28, height: 28, boxShadow: '0 0 0 2px #141633' }}>
                      +{moreTeams}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-accent btn-h10" to={`/tournois/${t.id}/bracket`}>
              <IconBracket />
              Voir le bracket
            </Link>
            {registrationsOpen &&
              (t.teamSize > 1 ? (
                <Link className="btn btn-h10 btn-glass" to={`/tournois/${t.id}/participants`}>
                  Inscrire mon équipe
                </Link>
              ) : (
                <button
                  className="btn btn-h10 btn-glass"
                  disabled={busy}
                  onClick={() => action(() => registerToTournament(t.id))}
                >
                  S'inscrire
                </button>
              ))}
            <button className="btn btn-h10 btn-icon btn-glass" aria-label="Options">
              <IconMore />
            </button>
          </div>
          {message && (
            <p className="field-hint is-error" style={{ marginTop: 12, marginBottom: 0 }}>{message}</p>
          )}
        </section>

        <nav className="tabbar">
          <a className="active">Vue d'ensemble</a>
          <Link to={`/tournois/${t.id}/bracket`}>Bracket</Link>
          <Link to={`/tournois/${t.id}/participants`}>Participants</Link>
          <a>Matchs</a>
          <a>Règlement</a>
        </nav>

        <div className="ov-grid">
          <div className="col-gap">
            <div className="card card-pad">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <span className="panel-title">Progression</span>
                <span className="font-mono" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                  {t.matchesPlayed} / {t.matchesTotal} matchs joués
                </span>
              </div>
              <div className="progress">
                <div className="bar" style={{ width: `${progress}%` }} />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 16,
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-foreground)' }}>
                  1/64 ✓ · 1/32 ✓ · 1/16 ✓ · 1/8 ✓ ·{' '}
                  <b style={{ color: 'var(--pa-live-dark)' }}>Quarts</b> · Demis · Finale
                </div>
              </div>
            </div>

            <div className="card">
              <div
                className="card-pad"
                style={{
                  paddingBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span className="panel-title">{t.currentPhaseLabel}</span>
                <Link className="btn btn-link" to={`/tournois/${t.id}/bracket`}>
                  Tout le bracket →
                </Link>
              </div>
              <div className="card-pad" style={{ paddingTop: 6 }}>
                {t.currentMatches.map((m) => (
                  <MatchLine m={m} key={m.id} />
                ))}
              </div>
            </div>
          </div>

          <div className="col-gap">
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 8 }}>
                Informations
              </div>
              <div className="info-row">
                <span className="k">Organisateur</span>
                <span className="v">{t.organizer}</span>
              </div>
              <div className="info-row">
                <span className="k">Jeu</span>
                <span className="v">{t.game}</span>
              </div>
              <div className="info-row">
                <span className="k">Format</span>
                <span className="v">
                  {FORMAT_LABELS[t.format]} · BO{t.bestOf}
                </span>
              </div>
              <div className="info-row">
                <span className="k">Check-in</span>
                <span className="v">{t.checkInWindow}</span>
              </div>
              <div className="info-row">
                <span className="k">Région</span>
                <span className="v">{t.region}</span>
              </div>
              <div className="info-row">
                <span className="k">Visibilité</span>
                <span className="v">
                  <span className="badge badge-secondary">
                    {t.visibility === 'public' ? 'Public' : 'Privé'}
                  </span>
                </span>
              </div>
            </div>
            <div className="card card-pad">
              <div className="panel-title" style={{ marginBottom: 14 }}>
                Administration
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  style={{ justifyContent: 'flex-start' }}
                  disabled={busy || !registrationsOpen}
                  title={registrationsOpen ? undefined : 'Le tournoi a déjà démarré'}
                  onClick={() =>
                    action(
                      () => generateBracket(t.id),
                      () => navigate(`/tournois/${t.id}/bracket`),
                    )
                  }
                >
                  <IconPanel />
                  Générer le bracket
                </button>
                <Link
                  className="btn btn-outline"
                  style={{ justifyContent: 'flex-start' }}
                  to={`/tournois/${t.id}/participants`}
                >
                  <IconEdit />
                  Gérer les participants
                </Link>
                <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                  <IconFlag />
                  Publier les résultats
                </button>
                <button className="btn btn-destructive" style={{ justifyContent: 'flex-start' }}>
                  <IconXCircle />
                  Annuler le tournoi
                </button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 30 }} />
      </main>
    </Shell>
  )
}
