import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/* Le module Keycloak est remplacé : on veut tester le comportement de
   AuthProvider face à un serveur d'identité injoignable, sans réseau. */
const initKeycloak = vi.fn()

/* Doublure de l'instance keycloak-js : `tokenParsed` est réécrit par les tests
   qui ont besoin d'une session ouverte, `updateToken` sert à observer le
   renouvellement silencieux. */
const keycloakStub = {
  tokenParsed: undefined as Record<string, unknown> | undefined,
  updateToken: vi.fn<(minValidity: number) => Promise<boolean>>(),
}

vi.mock('./keycloak', () => ({
  keycloakEnabled: true,
  keycloak: keycloakStub,
  initKeycloak: () => initKeycloak(),
  keycloakUrl: () => 'https://auth.exemple.fr',
}))

const { AuthProvider, useAuth } = await import('./AuthContext')

function Sonde() {
  const { ready, user, authError } = useAuth()
  return (
    <div>
      <span data-testid="ready">{String(ready)}</span>
      <span data-testid="user">{user?.pseudo ?? 'aucun'}</span>
      <span data-testid="error">{authError ?? 'aucune'}</span>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    initKeycloak.mockReset()
    keycloakStub.tokenParsed = undefined
    keycloakStub.updateToken.mockReset()
    keycloakStub.updateToken.mockResolvedValue(true)
  })

  it("signale l'erreur quand le serveur d'identité est injoignable", async () => {
    // Régression : sans le .catch, `ready` restait false pour toujours et
    // RequireAuth rendait `null` — l'application affichait une page blanche
    // muette, exactement ce qui s'est produit en production pendant l'attente
    // du certificat TLS du domaine.
    initKeycloak.mockRejectedValue(new Error('Failed to fetch'))

    render(
      <AuthProvider>
        <Sonde />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))
    expect(screen.getByTestId('error').textContent).toContain('injoignable')
    expect(screen.getByTestId('error').textContent).toContain('https://auth.exemple.fr')
    expect(screen.getByTestId('user').textContent).toBe('aucun')
  })

  it('renouvelle le jeton en silence pour tenir une session longue', async () => {
    // Le realm tolère 12 h d'inactivité, mais le jeton d'accès ne vit que 5 min
    // et n'était renouvelé qu'au moment d'un appel API : un onglet ouvert sans
    // interaction perdait sa session. Le maillon faible était le client.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    keycloakStub.tokenParsed = { preferred_username: 'alex', realm_access: { roles: ['player'] } }
    initKeycloak.mockResolvedValue(true)

    render(
      <AuthProvider>
        <Sonde />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alex'))
    expect(keycloakStub.updateToken).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(3 * 60 * 1000)
    expect(keycloakStub.updateToken).toHaveBeenCalledTimes(3)
    // Une marge supérieure à la période : le jeton ne doit jamais expirer entre
    // deux battements.
    expect(keycloakStub.updateToken.mock.calls[0][0]).toBeGreaterThan(60)

    vi.useRealTimers()
  })

  it('ne déconnecte pas quand un renouvellement échoue', async () => {
    // Réseau coupé une minute, ou session fermée dans un autre onglet : ce n'est
    // pas au battement d'éjecter l'utilisateur, le prochain appel API tranchera.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    keycloakStub.tokenParsed = { preferred_username: 'alex', realm_access: { roles: [] } }
    keycloakStub.updateToken.mockRejectedValue(new Error('réseau injoignable'))
    initKeycloak.mockResolvedValue(true)

    render(
      <AuthProvider>
        <Sonde />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alex'))

    await vi.advanceTimersByTimeAsync(2 * 60 * 1000)
    expect(keycloakStub.updateToken).toHaveBeenCalled()
    expect(screen.getByTestId('user').textContent).toBe('alex')
    expect(screen.getByTestId('error').textContent).toBe('aucune')

    vi.useRealTimers()
  })

  it('reste sans erreur quand aucune session n’est ouverte', async () => {
    initKeycloak.mockResolvedValue(false)

    render(
      <AuthProvider>
        <Sonde />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'))
    expect(screen.getByTestId('error').textContent).toBe('aucune')
    expect(screen.getByTestId('user').textContent).toBe('aucun')
  })
})
