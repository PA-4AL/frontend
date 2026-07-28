import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppConfig } from './config'

/** Recharge le module de config après avoir posé (ou non) window.__APP_CONFIG__. */
async function loadConfig(runtime?: Partial<AppConfig>): Promise<AppConfig> {
  if (runtime === undefined) {
    delete window.__APP_CONFIG__
  } else {
    window.__APP_CONFIG__ = runtime
  }
  vi.resetModules()
  const module = await import('./config')
  return module.config
}

describe('config runtime', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('utilise les valeurs injectées par le conteneur', async () => {
    const config = await loadConfig({
      apiUrl: 'https://api.exemple.fr',
      keycloakUrl: 'https://auth.exemple.fr',
      keycloakRealm: 'pa-tournament',
      keycloakClientId: 'pa-frontend',
    })

    expect(config.apiUrl).toBe('https://api.exemple.fr')
    expect(config.keycloakUrl).toBe('https://auth.exemple.fr')
  })

  it('ignore un placeholder non substitué et applique les valeurs par défaut', async () => {
    // Cas d'un envsubst incomplet : mieux vaut le mode démo qu'une URL invalide.
    const config = await loadConfig({
      apiUrl: '${API_URL}',
      keycloakUrl: '${KEYCLOAK_URL}',
      keycloakRealm: '${KEYCLOAK_REALM}',
      keycloakClientId: '${KEYCLOAK_CLIENT_ID}',
    })

    expect(config.apiUrl).toBe('')
    expect(config.keycloakUrl).toBe('')
    expect(config.keycloakRealm).toBe('pa-tournament')
    expect(config.keycloakClientId).toBe('pa-frontend')
  })

  it('retombe sur les valeurs par défaut sans config runtime', async () => {
    const config = await loadConfig(undefined)

    expect(config.keycloakRealm).toBe('pa-tournament')
    expect(config.keycloakClientId).toBe('pa-frontend')
  })
})
