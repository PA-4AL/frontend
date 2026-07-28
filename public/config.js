/* Configuration runtime de la SPA.

   - En développement : ce fichier reste vide, les variables VITE_* du .env sont utilisées.
   - En production : le conteneur nginx écrase ce fichier au démarrage à partir des
     variables d'environnement (voir docker/40-app-config.sh).

   Ne pas y écrire de secret : ce fichier est servi au navigateur. */
window.__APP_CONFIG__ = {}
