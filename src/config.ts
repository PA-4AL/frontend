/* Configuration résolue à l'exécution.

   En production, le conteneur nginx réécrit `/config.js` à son démarrage
   (`docker/40-app-config.sh`) à partir des variables d'environnement Cloud Run :
   la MÊME image fonctionne donc en dev, en préprod et en prod, sans rebuild.

   En développement (`vite`), `public/config.js` laisse l'objet vide et on
   retombe sur les variables `VITE_*` du fichier `.env`. */

export type AppConfig = {
  apiUrl: string
  keycloakUrl: string
  keycloakRealm: string
  keycloakClientId: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<AppConfig>
  }
}

const runtime: Partial<AppConfig> =
  typeof window === 'undefined' ? {} : (window.__APP_CONFIG__ ?? {})

function resolve(key: keyof AppConfig, fromEnv: string | undefined, fallback = ''): string {
  const value = runtime[key] ?? fromEnv ?? fallback
  // Un placeholder non substitué ("${API_URL}") équivaut à une valeur absente.
  return value.startsWith('${') ? fallback : value
}

export const config: AppConfig = {
  apiUrl: resolve('apiUrl', import.meta.env.VITE_API_URL),
  keycloakUrl: resolve('keycloakUrl', import.meta.env.VITE_KEYCLOAK_URL),
  keycloakRealm: resolve('keycloakRealm', import.meta.env.VITE_KEYCLOAK_REALM, 'pa-tournament'),
  keycloakClientId: resolve(
    'keycloakClientId',
    import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    'pa-frontend',
  ),
}
