import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useTheme } from '../lib/theme'
import { IconMoon, IconSun, IconTrophy, IconUserPlus } from '../lib/icons'

/** Page d'accueil : la connexion et l'inscription se font chez Keycloak. */
export function LoginPage() {
  const { dark, toggle } = useTheme()
  const { ready, user, login, register } = useAuth()

  // Déjà authentifié → tableau de bord
  if (ready && user) return <Navigate to="/" replace />

  return (
    <div>
      <button className="topnav-icon theme-fab" onClick={toggle} aria-label="Thème">
        {dark ? <IconSun /> : <IconMoon />}
      </button>

      <div className="auth-brand" style={{ minHeight: '100vh', alignItems: 'center', textAlign: 'center' }}>
        <div className="auth-grid-lines" />

        <div className="brand-top" style={{ justifyContent: 'center', marginTop: 24 }}>
          <div className="mark">PA</div>
          <div className="word">TOURNAMENT</div>
        </div>

        <div className="brand-hero" style={{ maxWidth: '34ch' }}>
          <span className="kicker" style={{ justifyContent: 'center' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--pa-live)',
                display: 'inline-block',
              }}
            />
            Plateforme de tournois esport
          </span>
          <h1>
            Organise.
            <br />
            Affronte.
            <br />
            <span className="accent">Domine.</span>
          </h1>
          <p>
            Crée tes brackets, gère tes équipes et suis chaque match en direct. La compétition
            commence ici.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-h10" style={{ minWidth: 180 }} onClick={() => login()}>
              <IconTrophy />
              Se connecter
            </button>
            <button
              className="btn btn-h10"
              style={{
                minWidth: 180,
                background: 'rgba(255,255,255,.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.18)',
              }}
              onClick={register}
            >
              <IconUserPlus />
              Créer un compte
            </button>
          </div>
        </div>

        <div className="brand-stats" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div className="s">
            <div className="v">2.4K</div>
            <div className="l">Tournois</div>
          </div>
          <div className="s">
            <div className="v">58K</div>
            <div className="l">Joueurs</div>
          </div>
          <div className="s">
            <div className="v">340</div>
            <div className="l">Live ce mois</div>
          </div>
        </div>
      </div>
    </div>
  )
}
