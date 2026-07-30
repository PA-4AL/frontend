import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchActivity, fetchDashboardKpis, fetchTournaments } from '../api/tournaments'
import type { ActivityItem, DashboardKpis, TournamentSummary } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Shell } from '../components/Shell'
import { FmtBadge, StatusBadge } from '../components/ui'
import {
  IconCheck,
  IconCheckCircle,
  IconLiveTarget,
  IconAlertTriangle,
  IconMedal,
  IconPlus,
  IconTrendUp,
  IconTrophy,
  IconUserPlus,
  IconUsers,
} from '../lib/icons'

type Filter = 'all' | 'live' | 'upcoming'

const FEED_STYLE: Record<ActivityItem['kind'], { bg: string; color: string; icon: ReactNode }> = {
  win: { bg: 'rgba(0,230,118,.12)', color: 'var(--pa-live-dark)', icon: <IconCheck /> },
  live: { bg: 'rgba(255,92,40,.12)', color: 'var(--pa-accent)', icon: <IconLiveTarget /> },
  registration: { bg: 'rgba(20,55,217,.12)', color: 'var(--pa-primary-light)', icon: <IconUserPlus /> },
  dispute: { bg: 'rgba(245,158,11,.14)', color: 'var(--status-warning)', icon: <IconAlertTriangle /> },
  finished: { bg: 'var(--muted)', color: 'var(--muted-foreground)', icon: <IconMedal /> },
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  const isOrganizer = user?.isOrganizer ?? false

  useEffect(() => {
    fetchDashboardKpis().then(setKpis).catch(() => setKpis(null))
    fetchTournaments().then(setTournaments).catch(() => setTournaments([]))
    // Le fil d'activité ne concerne que les organisateurs / admins
    if (isOrganizer) fetchActivity().then(setActivity).catch(() => setActivity([]))
  }, [isOrganizer])

  const filtered = tournaments.filter((t) => {
    if (filter === 'live') return t.status === 'ongoing'
    if (filter === 'upcoming') return t.status === 'registration' || t.status === 'check_in'
    return true
  })

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Shell
      breadcrumbs={[{ label: 'Admin' }, { label: 'Tableau de bord' }]}
      searchPlaceholder="Rechercher un tournoi…"
    >
      <main className="app-content" style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div className="page-head">
          <div>
            <h1 className="page-title">Tableau de bord</h1>
            <p className="page-sub">
              Bonjour {user?.pseudo ?? ''} — voici l'état de vos tournois aujourd'hui, {today}.
            </p>
          </div>
          <Link className="btn btn-primary btn-h10" to="/tournois/nouveau">
            <IconPlus />
            Créer un tournoi
          </Link>
        </div>

        <div className="kpi-grid">
          <div className="card kpi">
            <div className="k-label">
              <span className="k-icon" style={{ background: 'rgba(20,55,217,.12)', color: 'var(--pa-primary-light)' }}>
                <IconTrophy />
              </span>
              Tournois actifs
            </div>
            <div className="k-value">{kpis?.activeTournaments ?? '—'}</div>
            <div className="k-foot k-up">
              <IconTrendUp width={13} height={13} />
              {kpis?.activeTournamentsDelta}
            </div>
          </div>
          <div className="card kpi">
            <div className="k-label">
              <span className="k-icon" style={{ background: 'rgba(0,230,118,.12)', color: 'var(--pa-live-dark)' }}>
                <IconLiveTarget />
              </span>
              Matchs en direct
            </div>
            <div className="k-value" style={{ color: 'var(--pa-live-dark)' }}>
              {kpis?.liveMatches ?? '—'}
            </div>
            <div className="k-foot k-up">
              <span className="status-badge sb-live" style={{ height: 20 }}>
                <span className="dot live" />
                Live
              </span>
            </div>
          </div>
          <div className="card kpi">
            <div className="k-label">
              <span className="k-icon" style={{ background: 'rgba(255,92,40,.12)', color: 'var(--pa-accent)' }}>
                <IconUsers />
              </span>
              Participants
            </div>
            <div className="k-value">{kpis ? kpis.participants.toLocaleString('fr-FR') : '—'}</div>
            <div className="k-foot k-up">
              <IconTrendUp width={13} height={13} />
              {kpis?.participantsDelta}
            </div>
          </div>
          <div className="card kpi">
            <div className="k-label">
              <span className="k-icon" style={{ background: 'rgba(245,158,11,.14)', color: 'var(--status-warning)' }}>
                <IconCheckCircle />
              </span>
              En attente
            </div>
            <div className="k-value">{kpis?.pendingValidations ?? '—'}</div>
            <div className="k-foot" style={{ color: 'var(--muted-foreground)' }}>
              Validations à traiter
            </div>
          </div>
        </div>

        <div className="grid-2" style={isOrganizer ? undefined : { gridTemplateColumns: '1fr' }}>
          <div className="card">
            <div className="panel-head">
              <span className="panel-title">Tournois</span>
              <div className="tabs" style={{ height: 32 }}>
                <button className={'tab' + (filter === 'all' ? ' is-active' : '')} onClick={() => setFilter('all')}>
                  Tous
                </button>
                <button className={'tab' + (filter === 'live' ? ' is-active' : '')} onClick={() => setFilter('live')}>
                  Live
                </button>
                <button
                  className={'tab' + (filter === 'upcoming' ? ' is-active' : '')}
                  onClick={() => setFilter('upcoming')}
                >
                  À venir
                </button>
              </div>
            </div>
            <table className="t-list">
              <thead>
                <tr>
                  <th>Tournoi</th>
                  <th>Format</th>
                  <th className="hide-sm">Participants</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} onClick={() => navigate(`/tournois/${t.id}`)}>
                    <td>
                      <div className="t-name">{t.name}</div>
                      <div className="t-meta">
                        {t.code} · {t.scheduleLabel}
                      </div>
                    </td>
                    <td>
                      <FmtBadge format={t.format} />
                    </td>
                    <td className="hide-sm">
                      <span className="t-num">{t.participants}</span> / {t.maxParticipants}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isOrganizer && (
          <div className="card">
            <div className="panel-head">
              <span className="panel-title">Activité</span>
              <button className="btn btn-ghost btn-h8" style={{ color: 'var(--muted-foreground)' }}>
                Tout voir
              </button>
            </div>
            <div className="feed">
              {activity.map((a) => {
                const s = FEED_STYLE[a.kind]
                return (
                  <div className="feed-item" key={a.id}>
                    <span className="feed-dot" style={{ background: s.bg, color: s.color }}>
                      {s.icon}
                    </span>
                    <div className="feed-body">
                      {/* Rendu en texte, jamais en HTML : le serveur n'envoie plus
                          de balisage, et React échappe tout ce qu'il affiche.
                          C'est ce qui rend l'injection impossible plutôt que
                          seulement improbable. */}
                      <span>
                        <strong>{a.sujet}</strong> {a.action}
                        {a.complement ? ` ${a.complement}.` : ''}
                      </span>
                      <div className="feed-time">{a.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          )}
        </div>
        <div style={{ height: 30 }} />
      </main>
    </Shell>
  )
}
