import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchActivity, fetchDashboardKpis, fetchTournaments } from '../api/tournaments'
import { FILTRES_STATUT, segmenter, type FiltreStatut } from '../lib/sectionsTournois'
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
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('tous')

  const isOrganizer = user?.isOrganizer ?? false

  useEffect(() => {
    fetchDashboardKpis().then(setKpis).catch(() => setKpis(null))
    fetchTournaments().then(setTournaments).catch(() => setTournaments([]))
    // Le fil d'activité ne concerne que les organisateurs / admins
    if (isOrganizer) fetchActivity().then(setActivity).catch(() => setActivity([]))
  }, [isOrganizer])

  const sections = segmenter(tournaments, filtreStatut)

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
              {/* Filtre par statut : les trois onglets précédents (Tous / Live /
                  À venir) mélangeaient un filtre et une notion de section. La
                  séparation en sections rend le filtre orthogonal. */}
              <select
                className="input"
                style={{ width: 200, height: 32 }}
                aria-label="Filtrer par statut"
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
              >
                {FILTRES_STATUT.map((f) => (
                  <option key={f.valeur} value={f.valeur}>{f.libelle}</option>
                ))}
              </select>
            </div>
            {sections.length === 0 && (
              <p className="page-sub" style={{ padding: '16px 20px', margin: 0 }}>
                Aucun tournoi ne correspond à ce filtre.
              </p>
            )}
            {sections.map((section) => (
              <div key={section.cle}>
                <div style={{ padding: '14px 20px 6px' }}>
                  <div className="panel-title">
                    {section.titre}{' '}
                    <span className="t-meta">({section.tournois.length})</span>
                  </div>
                  <p className="t-meta" style={{ margin: 0 }}>{section.description}</p>
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
                    {section.tournois.map((t) => (
                      <tr key={t.id} onClick={() => navigate(`/tournois/${t.id}`)}>
                        <td>
                          <div className="t-name">{t.name}</div>
                          <div className="t-meta">
                            {t.code} · {t.scheduleLabel}
                            {t.viewerIsOrganizer ? ' · vous organisez' : ''}
                            {t.viewerIsRegistered ? ' · vous participez' : ''}
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
            ))}
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
