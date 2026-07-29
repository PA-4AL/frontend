/**
 * Les formats de phase, libellés et explications — **source unique**.
 *
 * Le format se choisit à la **création du tournoi** et rien ne le redemande
 * ensuite : l'écran Bracket applique celui de la phase. Cette liste sert donc au
 * sélecteur de création, et à l'affichage en lecture seule à la génération.
 *
 * Avant, le format était demandé au moment de générer. Deux endroits pouvaient
 * décider de la même chose, et le formulaire de création figeait
 * `single_elim` sans le dire — le tournoi affichait un format que la génération
 * pouvait contredire.
 *
 * Les valeurs correspondent à l'énumération PostgreSQL `phase_type`
 * (backend : `PhaseType`), et sont transmises telles quelles.
 */
export interface Format {
  valeur: string
  libelle: string
  aide: string
  /** Refusé par le backend : proposé grisé plutôt que promis (cf. ADR-0008). */
  indisponible?: boolean
}

export const FORMATS: Format[] = [
  {
    valeur: 'single_elim',
    libelle: 'Élimination simple',
    aide: 'Une défaite élimine. Le tableau compte n − 1 matchs.',
  },
  {
    valeur: 'double_elim',
    libelle: 'Élimination double',
    aide:
      'Une première défaite fait basculer dans le tableau des perdants, une seconde élimine. '
      + 'Deux fois plus de matchs, et une grande finale entre les deux tableaux. Minimum 4 participants.',
  },
  {
    valeur: 'round_robin',
    libelle: 'Round robin (toutes les rencontres)',
    aide:
      'Chacun rencontre tous les autres, réparti en journées. Le classement se fait aux victoires, '
      + 'sans élimination.',
  },
  {
    valeur: 'swiss',
    libelle: 'Suisse (à venir)',
    aide: 'Les appariements dépendent du classement après chaque tour : génération tour par tour, pas encore disponible.',
    indisponible: true,
  },
]

function trouver(valeur: string | undefined): Format | undefined {
  return FORMATS.find((f) => f.valeur === valeur)
}

/** Libellé lisible ; à défaut la valeur brute, plus utile qu'un vide. */
export function libelleFormat(valeur: string | undefined): string {
  return trouver(valeur)?.libelle ?? valeur ?? '—'
}

export function aideFormat(valeur: string | undefined): string {
  return trouver(valeur)?.aide ?? ''
}
