# ADR-0002 — Pas de librairie d'état ni de data-fetching

- **Date** : 2026-06-22
- **Statut** : accepté
- **Portée** : frontend

## Contexte

L'application compte une dizaine d'écrans, chacun affichant des données propres.
Le backend renvoie des DTOs **déjà mis en forme pour l'affichage** (libellés,
couleurs, statuts), donc le frontend n'a presque aucune transformation à faire ni
état métier à maintenir.

## Décision

S'en tenir à **React et React Router**, avec un état local par page
(`useState` + `useEffect`) et un client HTTP maison d'une centaine de lignes
(`src/api/client.ts`).

Écartés : **Redux / Zustand** (aucun état véritablement partagé à gérer) ;
**React Query / SWR** (le cache serait utile, mais c'est une dépendance
structurante pour un besoin qui ne s'est pas encore manifesté).

## Conséquences

- très peu de dépendances, donc peu de surface de maintenance et de mises à jour
- le domaine reste dans le backend : le frontend n'est qu'une couche de rendu, ce
  qui limite les dépendances externes dans l'interface comme le demande le brief
- **coût assumé** : aucun cache partagé. Le `Shell` refait trois appels d'API à
  chaque navigation. Si cela devenait gênant, un ADR de remplacement introduirait
  React Query
