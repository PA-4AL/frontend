#!/bin/sh
# Génère /config.js au démarrage du conteneur à partir des variables
# d'environnement (Cloud Run, docker compose…). Exécuté automatiquement par
# l'entrypoint des images nginx officielles (/docker-entrypoint.d/*.sh).
#
# Conséquence : une seule image pour tous les environnements — on ne rebuild pas
# pour changer une URL d'API ou de Keycloak.
set -eu

: "${API_URL:=}"
: "${KEYCLOAK_URL:=}"
: "${KEYCLOAK_REALM:=pa-tournament}"
: "${KEYCLOAK_CLIENT_ID:=pa-frontend}"

export API_URL KEYCLOAK_URL KEYCLOAK_REALM KEYCLOAK_CLIENT_ID

# Les quotes simples sont voulues : envsubst attend les NOMS des variables à
# substituer (sinon le shell les remplacerait avant l'appel).
# shellcheck disable=SC2016
envsubst '${API_URL} ${KEYCLOAK_URL} ${KEYCLOAK_REALM} ${KEYCLOAK_CLIENT_ID}' \
  < /etc/nginx/app-config.js.template \
  > /usr/share/nginx/html/config.js

echo "[40-app-config] config.js généré (API_URL=${API_URL:-<vide>}, KEYCLOAK_URL=${KEYCLOAK_URL:-<vide>})"
