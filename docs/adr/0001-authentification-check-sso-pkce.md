# ADR-0001 — Authentification par check-sso et PKCE

- **Date** : 2026-06-22
- **Statut** : accepté
- **Portée** : frontend

## Contexte

La spécification (§4.5) impose que toutes les connexions passent par Keycloak,
avec SSO Google et Discord. Une SPA est un **client public** : elle ne peut
détenir aucun secret, puisque tout son code est lisible dans le navigateur.

## Décision

Utiliser `keycloak-js` avec le flux *authorization code* et **PKCE (S256)**, en
mode `check-sso` : au chargement, l'application vérifie s'il existe une session
sans forcer de redirection. La promesse d'initialisation est **mémoïsée**, ce qui
est indispensable en `StrictMode` où React monte deux fois les effets.

Écarté : le flux *implicit* — obsolète, et il expose le jeton dans l'URL.
Écarté : l'octroi direct par mot de passe — il ferait transiter le mot de passe
par la SPA et contournerait le SSO fédéré.

## Conséquences

- aucun secret dans le code livré au navigateur
- le SSO fédéré fonctionne sans code spécifique : `idpHint` suffit à déléguer à
  Google ou Discord
- côté Keycloak, l'octroi direct est **désactivé** sur le client `pa-frontend` :
  toute obtention de jeton par mot de passe est refusée, ce qui est vérifiable
- conséquence opérationnelle : peupler des données par script demande de récupérer
  un jeton autrement (session navigateur, ou ouverture temporaire et documentée)
