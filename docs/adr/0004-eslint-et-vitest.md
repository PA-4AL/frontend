# ADR-0004 — ESLint et Vitest comme filet de qualité

- **Date** : 2026-07-28
- **Statut** : accepté
- **Portée** : frontend

## Contexte

Le dépôt n'avait **ni linter ni test** : la seule vérification automatisée était
`tsc`. Or la pipeline d'intégration exige une étape de lint et une étape de tests
unitaires.

## Décision

**ESLint 9** en configuration plate (`typescript-eslint` + `react-hooks`) et
**Vitest** avec `jsdom` et `@testing-library/react`. Les deux sont bloquants en
intégration continue.

## Conséquences

- le lint a immédiatement révélé un défaut réel : un `setState` synchrone dans un
  effet de `AuthContext`, corrigé en initialisant l'état au premier rendu
- les tests couvrent la résolution de la configuration runtime, les helpers
  d'affichage, et la panne du serveur d'identité
- Vitest partage la configuration de Vite : aucun outillage parallèle à maintenir
- deux avertissements `react-refresh/only-export-components` subsistent
  volontairement — ils signalent un mélange d'exports dans deux fichiers, sans
  conséquence à l'exécution
- il n'y a **pas** de test de bout en bout : piste identifiée, Playwright
