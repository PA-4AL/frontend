# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm install
npm run dev                 # Vite sur http://localhost:5173
npm run build               # tsc -b puis vite build → dist/
npm run preview             # sert dist/
npx tsc -b --force          # type-check seul (--force : contourne le cache incrémental)
docker build -t pa-frontend .   # build + nginx sur :8080 (Cloud Run)
```

Il n'y a **ni tests ni linter** dans ce dépôt : la seule vérification automatisée est
`tsc` (mode `strict` + `noUnusedLocals`/`noUnusedParameters`). Le `tsconfig.json` active
`verbatimModuleSyntax`, donc tout import de type doit passer par `import type { … }`.

## Configuration

L'app ne fonctionne pas « à vide » : sans `VITE_KEYCLOAK_URL`, `AuthProvider` laisse
`user` à `null` et `RequireAuth` renvoie toutes les routes vers `/connexion`, qui ne peut
que déclencher un login Keycloak. Copier `.env.example` vers `.env` (API + Keycloak) avant
de lancer `npm run dev`.

> Le README et quelques commentaires (`src/api/client.ts`, `src/auth/keycloak.ts`) parlent
> encore d'un « mode démo » avec `src/api/mock.ts` : ce fichier n'existe plus et il n'y a
> plus aucun fallback de données. En cas d'échec API, les pages retombent sur un état vide.

En build Docker, les variables `VITE_*` sont des `ARG` : elles sont figées au moment du
build de l'image, pas lues au runtime.

## Architecture

**SPA React 19 + React Router 7, sans librairie d'état ni de data-fetching.** Le state est
local à chaque page (`useState` + `useEffect`), il n'y a pas de cache partagé.

- `src/App.tsx` — toutes les routes sont déclarées dans le tableau `ROUTES` et enveloppées
  par `RequireAuth` ; seule `/connexion` est publique. Les chemins sont **en français**
  (`/tournois/:id`, `/equipes`, `/profil`).
- `src/auth/` — `keycloak.ts` initialise `keycloak-js` en `check-sso` + PKCE une seule fois
  (promesse mémoïsée, indispensable en `StrictMode`) ; `AuthContext.tsx` dérive l'utilisateur
  du token (`preferred_username`, `realm_access.roles`) et expose `isOrganizer`
  (rôle `organizer` ou `admin`) qui conditionne les vues enrichies (activité, validations).
- `src/api/` — `client.ts` fournit `apiGet/apiPost/apiPatch/apiDelete` : ils rafraîchissent
  le token (`updateToken(30)`) avant chaque appel, relancent un login si la session Keycloak
  est morte, et remontent le champ `message` des erreurs métier du backend. `tournaments.ts`
  et `profile.ts` ne sont que des fonctions typées sur les routes `/api/…` du backend
  Kotlin/Spring — pas de logique métier côté front.
- **Contrat d'API orienté affichage** : `src/api/types.ts` attend du backend des champs déjà
  formatés pour l'UI (`scheduleLabel`, `registeredLabel`, `checkInWindow`, `ActivityItem.html`,
  couleurs/codes d'équipe). Ajouter un champ affiché implique donc généralement une évolution
  côté backend, pas un formatage local.
- `src/components/Shell.tsx` — layout commun (sidebar repliable, drawer mobile, topnav,
  fil d'ariane). **Chaque page rend son contenu dans `<Shell breadcrumbs={…}>`.** Le Shell
  fait lui-même 3 appels API (tournois / KPIs / profil) pour alimenter la nav, donc ces
  requêtes repartent à chaque navigation.
- `src/lib/` — `theme.ts` (classe `dark` sur `<body>`, persistée dans `localStorage('pa-theme')`),
  `icons.tsx` (SVG inline, aucune dépendance d'icônes), `display.ts` (`Display.initials`,
  `Display.colorFor` — mêmes conventions que le backend).

## Design system

`src/styles/pa.css` est **identique octet pour octet à `mockups/pa.css`** : c'est le design
system (tokens `--pa-*`, thème clair/sombre, composants `.card`, `.btn`, `.status-badge`…).
Toute modification doit être répercutée des deux côtés. `src/styles/pages.css` contient
uniquement les styles spécifiques aux écrans React.

Le style se fait **par classes CSS existantes** (pas de CSS modules, pas de Tailwind, pas de
CSS-in-JS) ; les `style={{…}}` inline sont réservés aux valeurs dynamiques (couleurs d'équipe,
largeurs). Les couleurs passent par les variables CSS, jamais par des littéraux hex dans le TSX.

## Références

- `mockups/*.html` — maquettes de référence (Connexion, Tableau de bord, Détail tournoi,
  Bracket, Bibliothèque de composants). Une nouvelle page doit reprendre leur markup.
- `docs/PA-Tournament-Specs.md` — spécifications fonctionnelles ; les types de
  `src/api/types.ts` suivent le schéma de BDD du §6, les statuts (`TournamentStatus`,
  `RegistrationStatus`, `MatchStatus`) en sont issus tels quels.
- `docs/code-review.md` — revue du 22/06/2026, **findings encore ouverts** (XSS via
  `dangerouslySetInnerHTML` dans `DashboardPage.tsx`, `apiPatch` qui ne gère pas les 204,
  détection du capitaine par pseudo au lieu de `userId`…). À consulter avant de toucher aux
  fichiers concernés.

## Conventions

- Toute l'UI, les commentaires et les messages d'erreur sont **en français**.
- Pas de point-virgule en fin de ligne, guillemets simples, composants exportés en nommé
  (`export function DashboardPage()`), sauf `App` qui est export default.
- Commits en français, format Conventional Commits (`feat:`, `chore:`, `docs:`).
