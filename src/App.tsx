import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { BracketPage } from './pages/BracketPage'
import { CreateTournamentPage } from './pages/CreateTournamentPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ParticipantsPage, ParticipantsRedirect } from './pages/ParticipantsPage'
import { ProfilePage } from './pages/ProfilePage'
import { TeamsPage } from './pages/TeamsPage'
import { TournamentDetailPage } from './pages/TournamentDetailPage'
import { ValidationsPage } from './pages/ValidationsPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth()
  const location = useLocation()
  if (!ready) return null
  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />
  return children
}

const ROUTES: Array<{ path: string; element: ReactNode }> = [
  { path: '/', element: <DashboardPage /> },
  { path: '/tournois/nouveau', element: <CreateTournamentPage /> },
  { path: '/tournois/:id', element: <TournamentDetailPage /> },
  { path: '/tournois/:id/bracket', element: <BracketPage /> },
  { path: '/tournois/:id/participants', element: <ParticipantsPage /> },
  { path: '/participants', element: <ParticipantsRedirect /> },
  { path: '/validations', element: <ValidationsPage /> },
  { path: '/equipes', element: <TeamsPage /> },
  { path: '/profil', element: <ProfilePage /> },
  { path: '/parametres', element: <ProfilePage /> },
]

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={<RequireAuth>{r.element}</RequireAuth>} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
