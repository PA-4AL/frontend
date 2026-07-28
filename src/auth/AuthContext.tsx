import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { initKeycloak, keycloak, keycloakEnabled } from './keycloak'

export interface AuthUser {
  pseudo: string
  email: string
  initials: string
  roles: string[]
  /** Organisateur ou admin plateforme (vue enrichie : activité, validations…). */
  isOrganizer: boolean
}

interface AuthState {
  ready: boolean
  user: AuthUser | null
  /** Connexion par identifiants — redirige vers Keycloak (spec §4.5). */
  login: (email?: string) => void
  /** SSO fédéré : Keycloak délègue à Google / Discord. */
  loginWith: (provider: 'google' | 'discord') => void
  register: () => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

function initials(name: string): string {
  return name
    .split(/[\s._-]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Sans Keycloak configuré (mode démo), l'app est prête dès le premier rendu :
  // on l'initialise ici plutôt que par un setState synchrone dans l'effet.
  const [ready, setReady] = useState(!keycloakEnabled || keycloak === null)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    const kc = keycloak
    if (!keycloakEnabled || !kc) {
      console.warn('Keycloak non configuré (config.js / VITE_KEYCLOAK_URL) : authentification indisponible.')
      return
    }
    initKeycloak().then((authenticated) => {
      if (authenticated && kc.tokenParsed) {
        const pseudo =
          (kc.tokenParsed.preferred_username as string | undefined) ?? 'Joueur'
        const email = (kc.tokenParsed.email as string | undefined) ?? ''
        const realmAccess = kc.tokenParsed.realm_access as { roles?: string[] } | undefined
        const roles = realmAccess?.roles ?? []
        setUser({
          pseudo,
          email,
          initials: initials(pseudo),
          roles,
          isOrganizer: roles.includes('organizer') || roles.includes('admin'),
        })
      }
      setReady(true)
    })
  }, [])

  const login = useCallback((email?: string) => {
    void keycloak?.login({ loginHint: email, redirectUri: `${location.origin}/` })
  }, [])

  const loginWith = useCallback((provider: 'google' | 'discord') => {
    void keycloak?.login({ idpHint: provider, redirectUri: `${location.origin}/` })
  }, [])

  const register = useCallback(() => {
    void keycloak?.register({ redirectUri: `${location.origin}/` })
  }, [])

  const logout = useCallback(() => {
    void keycloak?.logout({ redirectUri: location.origin })
  }, [])

  const value = useMemo(
    () => ({ ready, user, login, loginWith, register, logout }),
    [ready, user, login, loginWith, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé sous <AuthProvider>')
  return ctx
}
