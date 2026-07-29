/* Intégration Keycloak (OIDC) — spec §4.5 : toutes les connexions passent
   par Keycloak (email/mot de passe ou SSO Google/Discord via idpHint).
   Sans VITE_KEYCLOAK_URL, l'app fonctionne en mode démo sans auth réelle. */

import Keycloak from 'keycloak-js'
import { config } from '../config'

const url: string = config.keycloakUrl
const realm: string = config.keycloakRealm
const clientId: string = config.keycloakClientId

export const keycloakEnabled = url !== ''

/** URL du serveur d'identité, pour les messages d'erreur. */
export const keycloakUrl = (): string => url

export const keycloak: Keycloak | null = keycloakEnabled
  ? new Keycloak({ url, realm, clientId })
  : null

let initialized: Promise<boolean> | null = null

export function initKeycloak(): Promise<boolean> {
  if (!keycloak) return Promise.resolve(false)
  if (!initialized) {
    initialized = keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`,
      pkceMethod: 'S256',
    })
  }
  return initialized
}

export function getToken(): string | null {
  return keycloak?.token ?? null
}
