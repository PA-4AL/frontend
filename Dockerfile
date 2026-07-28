# =============================================================================
# Frontend React/Vite — build de production puis service statique par nginx.
#
# Choix des images (justifications détaillées : infra/docs/DOCKER.md) :
#   - node:22.21.1-alpine       → Docker Official Image, Node 22 LTS ("Jod"),
#                                 tag patch épinglé = build reproductible.
#   - nginx-unprivileged:1.31.2 → image officielle NGINX Inc., tourne en UID 101
#                                 (aucun processus root) et écoute sur 8080,
#                                 ce qu'attend Cloud Run.
# Build de production uniquement (`npm run build` = tsc -b && vite build),
# jamais `npm run dev`.
# =============================================================================

FROM node:22.21.1-alpine AS build
WORKDIR /app

# 1) Dépendances seules : couche invalidée uniquement si le lockfile change.
COPY package.json package-lock.json ./
RUN npm ci

# 2) Sources : un changement de code ne réinstalle pas les dépendances.
COPY . .
RUN npm run build


FROM nginxinc/nginx-unprivileged:1.31.2-alpine AS runtime

# Configuration du serveur + gabarit de la config runtime de la SPA.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/config.js.template /etc/nginx/app-config.js.template
# Exécuté par l'entrypoint nginx au démarrage : écrit /config.js.
COPY --chmod=0755 docker/40-app-config.sh /docker-entrypoint.d/40-app-config.sh

# UID 101 = utilisateur nginx de l'image ; il doit pouvoir réécrire config.js.
COPY --from=build --chown=101:0 /app/dist /usr/share/nginx/html

EXPOSE 8080
