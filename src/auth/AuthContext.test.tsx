import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/* Le module Keycloak est remplacé : on veut tester le comportement de
   AuthProvider face à un serveur d'identité injoignable, sans réseau. */
const initKeycloak = vi.fn()

vi.mock('./keycloak', () => ({
  keycloakEnabled: true,
  keycloak: { tokenParsed: undefined },
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
