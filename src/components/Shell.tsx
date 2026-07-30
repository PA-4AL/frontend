import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { fetchProfile } from '../api/profile'
import { fetchDashboardKpis, fetchTournaments } from '../api/tournaments'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../lib/theme'
import { Annonces } from './Annonces'
import {
  IconBracket,
  IconCheckCircle,
  IconChevronLeft,
  IconDashboard,
  IconMenu,
  IconMoon,
  IconSearch,
  IconSun,
  IconTrophy,
  IconUsers,
} from '../lib/icons'
import { Avatar } from './ui'

interface NavEntry {
  to: string
  label: string
  icon: ReactNode
  badge?: string
  end?: boolean
}

export interface Crumb {
  label: string
  to?: string
}

export function Shell({
  breadcrumbs,
  searchPlaceholder,
  className,
  children,
}: {
  breadcrumbs: Crumb[]
  searchPlaceholder?: string
  className?: string
  children: ReactNode
}) {
  const { dark, toggle } = useTheme()
  const { user } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('pa-sidebar-collapsed') === '1',
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Le tournoi "courant" de la sidebar : le premier en cours, sinon le premier
  const [featuredId, setFeaturedId] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [pseudo, setPseudo] = useState<string | null>(null)

  useEffect(() => {
    fetchTournaments()
      .then((list) => {
        const featured = list.find((t) => t.status === 'ongoing') ?? list[0]
        setFeaturedId(featured?.id ?? null)
      })
      .catch(() => setFeaturedId(null))
    fetchDashboardKpis()
      .then((k) => setPendingCount(k.pendingValidations))
      .catch(() => setPendingCount(0))
    fetchProfile()
      .then((p) => {
        setAvatarUrl(p.avatarUrl)
        setPseudo(p.pseudo)
      })
      .catch(() => undefined)
  }, [])

  const navMain: NavEntry[] = [
    { to: '/', label: 'Tableau de bord', icon: <IconDashboard />, end: true },
    { to: featuredId ? `/tournois/${featuredId}` : '/', label: 'Tournois', icon: <IconTrophy /> },
    { to: '/participants', label: 'Participants', icon: <IconUsers /> },
    {
      to: '/validations',
      label: 'Validations',
      icon: <IconCheckCircle />,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    {
      to: featuredId ? `/tournois/${featuredId}/bracket` : '/',
      label: 'Brackets',
      icon: <IconBracket />,
    },
    { to: '/equipes', label: 'Équipes', icon: <IconUsers /> },
  ]


  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem('pa-sidebar-collapsed', c ? '0' : '1')
      return !c
    })
  }

  function navItem(n: NavEntry) {
    // "Tournois" et "Brackets" sont actifs selon le segment d'URL, pas le chemin exact
    const isBracketPage = location.pathname.endsWith('/bracket')
    const forcedActive =
      n.label === 'Brackets'
        ? isBracketPage
        : n.label === 'Tournois'
          ? location.pathname.startsWith('/tournois') && !isBracketPage
          : undefined
    return (
      <NavLink
        key={n.label}
        to={n.to}
        end={n.end}
        className={({ isActive }) =>
          'nav-item' + ((forcedActive ?? isActive) ? ' is-active' : '')
        }
        onClick={() => setDrawerOpen(false)}
      >
        {n.icon}
        <span className="label">{n.label}</span>
        {n.badge && <span className="nav-badge">{n.badge}</span>}
      </NavLink>
    )
  }

  return (
    <div className={'app-shell' + (className ? ` ${className}` : '')}>
      <aside
        className={
          'sidebar' + (collapsed ? ' collapsed' : '') + (drawerOpen ? ' drawer-open' : '')
        }
      >
        <div className="sidebar-logo">
          <div className="mark">PA</div>
          <div className="word">TOURNAMENT</div>
        </div>
        <button className="sidebar-toggle" onClick={toggleCollapsed} aria-label="Replier la sidebar">
          <IconChevronLeft />
        </button>
        <nav className="sidebar-nav">{navMain.map(navItem)}</nav>
        <div className="sidebar-foot">
          <NavLink className="nav-item" to="/profil" title="Mon profil">
            <Avatar color="var(--pa-accent)" src={avatarUrl}>{user?.initials ?? '??'}</Avatar>
            <span className="label">{pseudo ?? user?.pseudo ?? 'Invité'}</span>
          </NavLink>
        </div>
      </aside>
      <div
        className={'sidebar-backdrop' + (drawerOpen ? ' show' : '')}
        onClick={() => setDrawerOpen(false)}
      />

      <div className="app-main">
        <header className="topnav">
          <button
            className="topnav-icon nav-hamburger"
            aria-label="Menu"
            onClick={() => setDrawerOpen(true)}
          >
            <IconMenu />
          </button>
          <nav className="breadcrumbs">
            {breadcrumbs.map((c, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <span className="sep" />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="crumb current">{c.label}</span>
                ) : c.to ? (
                  <Link to={c.to}>{c.label}</Link>
                ) : (
                  <span className="crumb">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
          <div className="spacer" />
          {searchPlaceholder && (
            <div className="topnav-search hide-sm">
              <IconSearch width={16} height={16} style={{ color: 'var(--muted-foreground)' }} />
              <span>{searchPlaceholder}</span>
            </div>
          )}
          <button className="topnav-icon" onClick={toggle} aria-label="Thème">
            {dark ? <IconSun /> : <IconMoon />}
          </button>
          <Annonces />
          <Link to="/profil" title="Mon profil" style={{ display: 'flex' }}>
            <Avatar color="var(--pa-accent)" src={avatarUrl}>{user?.initials ?? '??'}</Avatar>
          </Link>
        </header>
        {children}
      </div>
    </div>
  )
}
