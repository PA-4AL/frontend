# ADR-0003 — Configuration résolue au démarrage du conteneur

- **Date** : 2026-07-28
- **Statut** : accepté
- **Portée** : frontend, infra

## Contexte

Vite remplace les variables `VITE_*` **à la compilation**. Les URLs de l'API et de
Keycloak étaient donc figées dans le bundle, ce qui imposait **une image par
environnement** — et interdisait de promouvoir en production l'image exacte qui
avait été validée en test.

## Décision

Résoudre la configuration **au démarrage du conteneur** : le script
`docker/40-app-config.sh` génère `/config.js` par substitution de variables
d'environnement, et `src/config.ts` lit `window.__APP_CONFIG__` avec repli sur les
`VITE_*` en développement. Un placeholder non substitué est traité comme une
valeur absente.

## Conséquences

- **une seule image pour tous les environnements** : celle qui est testée est
  celle qui est déployée
- changer une URL ne demande plus qu'un redéploiement de révision, pas un rebuild
- `/config.js` et `index.html` doivent être servis en `no-store`, sinon un
  navigateur garderait l'ancienne configuration après une bascule
- une requête réseau supplémentaire au chargement, bloquante avant le bundle
- ne **jamais** y mettre de secret : le fichier est public par construction
