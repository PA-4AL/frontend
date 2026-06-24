# Code Review — Frontend PA4

> Revue du 2026-06-22 · 7 findings · stack React 19 / TypeScript / Vite 6

---

## Synthèse

| Fichier | Sévérité | Problème |
|---|---|---|
| `DashboardPage.tsx:202` | 🔴 High | XSS via `dangerouslySetInnerHTML` sur donnée API |
| `client.ts:76` | 🟡 Medium | `apiPatch` ne gère pas la réponse 204 |
| `ParticipantsPage.tsx:54` · `TeamsPage.tsx:145` | 🟡 Medium | Détection capitaine par `pseudo` au lieu de `userId` |
| `Shell.tsx:59–75` | 🟡 Medium | 3 requêtes API relancées à chaque navigation |
| `AuthContext.tsx:34–42` | 🔵 Low | `initials()` dupliquée — déjà dans `Display.initials()` |
| `BracketPage.tsx:330` | 🔵 Low | Zoom handlers stockés sur propriété DOM `__zoom` |
| Toutes les pages | 🔵 Low | Pas d'indicateur de chargement pendant le fetch initial |

---

## Findings détaillés

### 🔴 XSS via dangerouslySetInnerHTML — `DashboardPage.tsx:202`

Le fil d'activité injecte directement le HTML renvoyé par l'API sans sanitisation côté client.
Un backend compromis ou une injection en base peut exécuter du JS dans le navigateur.

```tsx
// ❌ actuellement
<span dangerouslySetInnerHTML={{ __html: a.html }} />

// ✅ avec DOMPurify (npm install dompurify @types/dompurify)
import DOMPurify from 'dompurify'
<span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.html) }} />

// ou mieux : faire renvoyer du texte structuré par le backend
// et construire le JSX côté client (plus de dangerouslySetInnerHTML du tout)
```

---

### 🟡 apiPatch ne gère pas la réponse 204 — `client.ts:76`

`apiPost` et `apiDelete` retournent `undefined as T` sur 204, mais `apiPatch` tente toujours
`res.json()`. Si le backend répond 204 à un PATCH, l'appel lève une JSON parse error alors
que l'opération a réussi.

```ts
// ❌ client.ts:76
  return res.json() as Promise<T>

// ✅ ajouter avant le return
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
```

---

### 🟡 Détection capitaine par pseudo — `ParticipantsPage.tsx:54` · `TeamsPage.tsx:145`

La vérification `m.pseudo === user?.pseudo` suppose l'unicité des pseudos, non garantie.
Deux joueurs avec le même pseudo verraient les droits capitaine s'appliquer incorrectement.

```ts
// ❌ ParticipantsPage.tsx:54 et TeamsPage.tsx:145
t.members.some((m) => m.role === 'captain' && m.pseudo === user?.pseudo)

// ✅ après avoir exposé userId dans AuthUser (kc.tokenParsed.sub)
t.members.some((m) => m.role === 'captain' && m.userId === user?.id)
```

Dans `AuthContext.tsx`, ajouter `id: kc.tokenParsed.sub as string` à l'objet `AuthUser`.

---

### 🟡 Shell recharge 3 endpoints à chaque navigation — `Shell.tsx:59–75`

Chaque page monte `<Shell>` qui déclenche trois fetch (tournaments, KPIs, profile) sans
mise en cache. `DashboardPage` en refait deux par-dessus.

Solution sans librairie tierce : déplacer ces fetches dans un contexte partagé `AppDataContext`
monté à côté de `AuthProvider`, ou utiliser un layout route React Router pour ne monter
le Shell qu'une seule fois.

---

### 🔵 initials() dupliquée — `AuthContext.tsx:34–42`

La fonction locale est identique à `Display.initials()` dans `src/lib/display.ts`.

```ts
// ❌ supprimer la fonction locale (AuthContext.tsx:34–42)
function initials(name: string): string { ... }

// ✅ importer
import { Display } from '../lib/display'
// utiliser Display.initials(pseudo)
```

---

### 🔵 Zoom handlers sur propriété DOM — `BracketPage.tsx:330`

Les handlers sont attachés via `viewport.__zoom = zoomHandlers` pour traverser la barrière
useEffect. Fragile — TypeScript ne le type pas, et ça casse si l'élément est recréé.

```ts
// ❌ actuellement
;(viewport as HTMLDivElement & { __zoom?: ... }).__zoom = zoomHandlers

// ✅ ref propre
const zoomRef = useRef<{ in: ()=>void; out: ()=>void; fit: ()=>void } | null>(null)
// dans l'useEffect : zoomRef.current = zoomHandlers
// dans zoomAction  : zoomRef.current?.[kind]?.()
```

---

### 🔵 Pas d'indicateur de chargement

Les tables s'affichent vides pendant le fetch sans aucun signal visuel. Ajouter un état
`loading: boolean` initialisé à `true`, passé à `false` dans le `.finally()` du fetch.

---

## Ce qui fonctionne bien

- **Gestion erreurs API** : `apiPost` remonte le message métier du backend en priorité, avec
  fallback 401/403 explicite.
- **Refresh token Keycloak** : rafraîchissement à 30 s avec fallback sur login — pas de token
  périmé envoyé silencieusement.
- **BracketPage pointer events** : `setPointerCapture` + pinch touch corrects, cleanup complet
  dans le return de l'effet, pas de fuite.
- **Types API** : discriminated unions couvrent tous les statuts, le compilateur attrape les
  cas manquants.
- **Design system CSS** : tokens custom properties propres, dark mode par classe prévisible,
  thème persisté sans dépendance externe.
- **Mode démo** : fallback sans `VITE_KEYCLOAK_URL`, pas d'erreur fatale au démarrage.
