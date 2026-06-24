# PA Tournament — Frontend

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
