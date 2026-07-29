import type { BracketMatch } from '../api/types'

/**
 * Réorganisation manuelle du bracket : on prend une équipe, on la pose ailleurs.
 *
 * Le geste tient en deux clics — sélectionner, puis désigner la destination —
 * plutôt qu'en glisser-déposer. Ce choix est délibéré : le viewport du bracket
 * capture déjà le pointeur pour se déplacer, et faire cohabiter deux gestes de
 * glissement dans la même zone est la meilleure façon de reproduire le défaut
 * qui rendait les boutons inertes (voir bracketDrag.ts).
 *
 * La logique de sélection vit ici, à l'écart de React : elle se teste sans
 * rendu, et c'est elle qui porte les règles.
 */

/** Un emplacement = un match et un slot, exactement comme à l'écran. */
export interface Emplacement {
  matchId: string
  slot: 1 | 2
}

export function memeEmplacement(a: Emplacement | null, b: Emplacement | null): boolean {
  if (!a || !b) return false
  return a.matchId === b.matchId && a.slot === b.slot
}

/**
 * Un match peut-il être réorganisé ?
 *
 * Déplacer une équipe hors d'un match joué invaliderait son résultat — le
 * backend le refuse, autant ne pas le proposer. Un match en cours est exclu
 * pour la même raison.
 */
export function estReorganisable(m: BracketMatch): boolean {
  return m.matchId !== undefined && m.status !== 'done' && m.status !== 'live'
}

export type ActionReorganisation =
  | { type: 'selectionner'; emplacement: Emplacement }
  | { type: 'annuler' }
  | { type: 'echanger'; de: Emplacement; vers: Emplacement }
  | { type: 'rien' }

/**
 * Que produit un clic sur `cible`, compte tenu de la sélection en cours ?
 *
 * @param vide l'emplacement visé n'a pas d'équipe (bye, ou vainqueur encore
 *   inconnu) : on ne peut rien y prendre, mais on peut y déposer.
 */
export function prochaineAction(
  selection: Emplacement | null,
  cible: Emplacement,
  vide: boolean,
): ActionReorganisation {
  if (!selection) {
    // Rien de sélectionné : un emplacement vide n'offre rien à saisir.
    return vide ? { type: 'rien' } : { type: 'selectionner', emplacement: cible }
  }
  // Recliquer au même endroit annule — sinon on serait piégé dans la sélection.
  if (memeEmplacement(selection, cible)) return { type: 'annuler' }
  return { type: 'echanger', de: selection, vers: cible }
}
