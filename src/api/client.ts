/* Client HTTP minimal vers le backend Kotlin/Spring.
   Si VITE_API_URL n'est pas défini ou que l'appel échoue, les services
   retombent sur les données de démonstration (mock.ts). */

import { getToken, keycloak } from '../auth/keycloak'
import { config } from '../config'

const API_URL: string = config.apiUrl

export function apiConfigured(): boolean {
  return API_URL !== ''
}

/* Versionnement de l'API — voir backend/docs/API-VERSIONING.md.
   La version est choisie appel par appel : quand une route passe en v2, seule sa
   ligne change (`v1(...)` → `v2(...)`), les autres continuent d'appeler la v1. */

export const v1 = (path: string): string => `/api/v1${path}`

// export const v2 = (path: string): string => `/api/v2${path}`   // à la première breaking change

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (keycloak?.authenticated) {
    try {
      // Rafraîchit le token s'il expire dans moins de 30 s
      await keycloak.updateToken(30)
    } catch {
      // Session Keycloak expirée : on relance le login plutôt que d'envoyer
      // un token périmé (l'utilisateur revient sur la page en cours).
      await keycloak.login({ redirectUri: location.href })
    }
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(`API ${res.status} sur ${path}`)
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    // Les erreurs métier du backend (409, 400…) portent un message utile
    const detail = await res
      .json()
      .then((b: { message?: string }) => b.message)
      .catch(() => undefined)
    throw new Error(
      detail ??
        (res.status === 401 || res.status === 403
          ? 'Connexion requise pour cette action.'
          : `API ${res.status} sur ${path}`),
    )
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const headers = await authHeaders()
  headers['Content-Type'] = 'application/json'
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res
      .json()
      .then((b: { message?: string }) => b.message)
      .catch(() => undefined)
    throw new Error(detail ?? `API ${res.status} sur ${path}`)
  }
  // 204 : corps vide. `res.json()` lèverait une SyntaxError, transformant une
  // réussite en échec affiché à l'utilisateur.
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status} sur ${path}`)
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
