# PA Tournament — Frontend

[![CI](https://github.com/PA-4AL/frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/PA-4AL/frontend/actions/workflows/ci.yml)

**Déploiement et contribution** — flow git, pipelines et mise en production sont
documentés dans le repo `infra` :
[GIT-FLOW](https://github.com/PA-4AL/infra/blob/main/docs/GIT-FLOW.md) ·
[CI-CD](https://github.com/PA-4AL/infra/blob/main/docs/CI-CD.md) ·
[DEPLOY](https://github.com/PA-4AL/infra/blob/main/docs/DEPLOY.md) ·
[DOCKER](https://github.com/PA-4AL/infra/blob/main/docs/DOCKER.md)

## Qualité (jouée par la CI à chaque commit et chaque PR)

```bash
npm run lint        # ESLint 9
npm run typecheck   # tsc
npm test            # Vitest
```

## Image de production

```bash
docker build -t pa-frontend .
docker run --rm -p 8080:8080 -e API_URL=http://localhost:8080 -e KEYCLOAK_URL=http://localhost:8081 pa-frontend
```

La configuration (URLs d'API et de Keycloak) est injectée **au démarrage du
conteneur** dans `/config.js` : une seule image sert tous les environnements.

SPA React (Vite + TypeScript) de la plateforme de gestion de tournois esport.
Spécifications : [`docs/PA-Tournament-Specs.md`](docs/PA-Tournament-Specs.md) ·
Maquettes HTML de référence : [`mockups/`](mockups/) (design system `pa.css`).

## Écrans

| Route | Écran | Maquette |
|---|---|---|
| `/connexion` | Connexion / inscription (Keycloak OIDC + SSO Google/Discord) | `mockups/Connexion.html` |
| `/` | Tableau de bord (KPIs, liste des tournois, fil d'activité) | `mockups/Tableau de bord.html` |
| `/tournois/:id` | Détail tournoi (hero, progression, matchs, administration) | `mockups/Détail tournoi.html` |
| `/tournois/:id/bracket` | Bracket interactif (zoom, pan, pinch) | `mockups/Bracket.html` |

Thème clair/sombre persistant, sidebar repliable, responsive mobile (drawer).

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
```

Sans configuration, l'app tourne en **mode démo** : connexion factice et
données d'exemple (`src/api/mock.ts`).

## Brancher le backend et Keycloak

Copier `.env.example` vers `.env` :

```bash
VITE_API_URL=http://localhost:8080          # API Kotlin/Spring
VITE_KEYCLOAK_URL=http://localhost:8081     # Keycloak (realm pa-tournament)
VITE_KEYCLOAK_REALM=pa-tournament
VITE_KEYCLOAK_CLIENT_ID=pa-frontend
```

- Auth : `keycloak-js` en mode `check-sso` + PKCE. Les boutons Google/Discord
  utilisent `idpHint` (la fédération est configurée côté Keycloak — spec §4.5).
- API : chaque service (`src/api/tournaments.ts`) tente l'endpoint réel puis
  retombe sur les données de démo si l'appel échoue.

## Build & Docker

```bash
npm run build      # dist/
docker build -t pa-frontend .   # nginx sur :8080, prêt pour Cloud Run
```

## Structure

```
src/
├── api/          # client HTTP, types (schéma spec §6), mocks
├── auth/         # Keycloak + AuthContext (mode démo sans Keycloak)
├── components/   # Shell (sidebar/topnav), composants UI
├── lib/          # icônes SVG, thème
├── pages/        # Connexion, Dashboard, Détail tournoi, Bracket
└── styles/       # pa.css (design system) + pages.css
```
