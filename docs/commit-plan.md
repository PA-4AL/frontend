# Plan de commits — Frontend PA4

Ordre logique : config → infra → couche données → auth → UI → pages → routeur → docs.
Chaque commit est autonome et compilable.

---

## Commandes git

```bash
# Vérifier l'état avant de commencer
git status
git log --oneline
```

---

## Séquence

### 01 — Init projet

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html .env.example
git commit -m "chore: init projet Vite + TypeScript"
```

---

### 02 — Config déploiement

```bash
git add Dockerfile nginx.conf
git commit -m "chore: config déploiement Docker + nginx"
```

---

### 03 — Types API

```bash
git add src/api/types.ts
git commit -m "feat: types API — schéma complet aligné spec §6"
```

---

### 04 — Client HTTP

```bash
git add src/api/client.ts
git commit -m "feat: client HTTP avec auth Bearer et fallback 204"
```

---

### 05 — Endpoints tournois

```bash
git add src/api/tournaments.ts
git commit -m "feat: endpoints tournois, bracket et dashboard"
```

---

### 06 — Endpoints profil

```bash
git add src/api/profile.ts
git commit -m "feat: endpoints profil, comptes jeu et équipes"
```

---

### 07 — Authentification Keycloak

```bash
git add src/auth/keycloak.ts src/auth/AuthContext.tsx public/silent-check-sso.html
git commit -m "feat: authentification Keycloak OIDC + SSO Google/Discord"
```

---

### 08 — Utilitaires

```bash
git add src/lib/display.ts src/lib/theme.ts src/lib/icons.tsx
git commit -m "feat: utilitaires — display, thème dark/light, icônes SVG"
```

---

### 09 — Design system CSS

```bash
git add src/styles/pa.css src/styles/pages.css
git commit -m "feat: design system CSS — tokens, layout, composants"
```

---

### 10 — Composants UI

```bash
git add src/components/ui.tsx
git commit -m "feat: composants UI — Avatar, StatusBadge, FmtBadge"
```

---

### 11 — Shell (layout principal)

```bash
git add src/components/Shell.tsx
git commit -m "feat: Shell — layout principal, sidebar, topnav"
```

---

### 12 — Page connexion

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat: page connexion avec SSO Google et Discord"
```

---

### 13 — Tableau de bord

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: tableau de bord — KPIs, liste tournois, fil activité"
```

---

### 14 — Création de tournoi

```bash
git add src/pages/CreateTournamentPage.tsx
git commit -m "feat: création de tournoi — formulaire multi-jeu"
```

---

### 15 — Détail tournoi

```bash
git add src/pages/TournamentDetailPage.tsx
git commit -m "feat: détail tournoi — phases, matchs en cours, admin panel"
```

---

### 16 — Bracket interactif

```bash
git add src/pages/BracketPage.tsx
git commit -m "feat: bracket interactif — pan, zoom, saisie de score"
```

---

### 17 — Gestion participants

```bash
git add src/pages/ParticipantsPage.tsx
git commit -m "feat: gestion participants — inscription, seeds, validation"
```

---

### 18 — Validations

```bash
git add src/pages/ValidationsPage.tsx
git commit -m "feat: validations — file d'attente d'inscriptions"
```

---

### 19 — Profil utilisateur

```bash
git add src/pages/ProfilePage.tsx
git commit -m "feat: profil — avatar, pseudo, comptes in-game, historique"
```

---

### 20 — Équipes

```bash
git add src/pages/TeamsPage.tsx
git commit -m "feat: équipes — roster, capitaine, gestion membres"
```

---

### 21 — Routeur principal

```bash
git add src/App.tsx src/main.tsx src/vite-env.d.ts
git commit -m "feat: routeur principal et point d'entrée React"
```

---

### 22 — Documentation

```bash
git add docs/ mockups/ README.md
git commit -m "docs: specs fonctionnelles et maquettes de référence"
```

---

## Push

```bash
# Pousser tout d'un coup sur main
git push origin main

# Ou vérifier d'abord ce qui sera poussé
git log origin/main..HEAD --oneline
git push origin main
```
