/**
 * Le viewport du bracket se déplace au glisser, ce qui l'oblige à capturer le
 * pointeur (`setPointerCapture`). Or une capture **redirige les événements
 * suivants vers l'élément capturant** : le `click` n'atteint plus le bouton
 * survolé, il est délivré au viewport. Tout contrôle posé au-dessus du bracket
 * devient donc inerte — symptôme observé en production, un bouton « Générer le
 * bracket » qui n'émettait aucune requête, sans la moindre erreur.
 *
 * D'où cette fonction : décider si un `pointerdown` doit démarrer un
 * glissement. La liste d'exclusions est volontairement exprimée en **types de
 * contrôles** (`button`, `select`, `input`…) et non en classes CSS : une liste
 * de classes est à refaire à chaque nouvel élément d'interface, et c'est
 * exactement ainsi que le défaut est apparu — l'exception ne couvrait que les
 * cartes de match et la barre de zoom, écrites avant la carte de génération.
 *
 * `[data-no-drag]` permet d'exclure un conteneur entier sans énumérer ce qu'il
 * contient.
 */
const NON_GLISSABLE = [
  'button',
  'select',
  'input',
  'textarea',
  'label',
  'a[href]',
  '[role="button"]',
  '[data-no-drag]',
  '.bm-team', // carte de match : ouvre la saisie de score
  '.zoom-bar',
].join(', ')

/** `true` si un `pointerdown` sur cette cible doit déplacer le bracket. */
export function peutDemarrerUnGlissement(cible: EventTarget | null): boolean {
  if (!(cible instanceof Element)) return false
  return cible.closest(NON_GLISSABLE) === null
}
