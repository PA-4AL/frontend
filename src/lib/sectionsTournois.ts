import type { TournamentSummary } from '../api/types'

/**
 * Répartition des tournois en sections, du point de vue du lecteur.
 *
 * Tout était affiché dans une seule liste, où un tournoi terminé voisinait avec
 * un tournoi ouvert aux inscriptions. Or ce ne sont pas les mêmes intentions :
 * *où en suis-je ?* d'un côté, *à quoi puis-je m'inscrire ?* de l'autre. Les
 * mélanger oblige le lecteur à trier lui-même à chaque visite.
 *
 * La répartition s'appuie sur `viewerIsOrganizer` / `viewerIsRegistered`, calculés
 * par le serveur : le client n'a pas à connaître la table des organisateurs, ni à
 * recouper les inscriptions.
 */

export type FiltreStatut = 'tous' | 'registration' | 'check_in' | 'ongoing' | 'finished' | 'draft'

export interface SectionTournois {
  cle: string
  titre: string
  description: string
  tournois: TournamentSummary[]
}

/** Statuts proposés au filtre, avec leur libellé. */
export const FILTRES_STATUT: Array<{ valeur: FiltreStatut; libelle: string }> = [
  { valeur: 'tous', libelle: 'Tous les statuts' },
  { valeur: 'draft', libelle: 'Brouillon' },
  { valeur: 'registration', libelle: 'Inscriptions ouvertes' },
  { valeur: 'check_in', libelle: 'Check-in' },
  { valeur: 'ongoing', libelle: 'En cours' },
  { valeur: 'finished', libelle: 'Terminés' },
]

/** Le lecteur est-il engagé dans ce tournoi, comme organisateur ou participant ? */
export function estEngage(t: TournamentSummary): boolean {
  return t.viewerIsOrganizer === true || t.viewerIsRegistered === true
}

const OUVERTS = ['registration', 'check_in']
const CLOS = ['finished', 'cancelled']

/**
 * @param filtre statut retenu ; `tous` ne retire rien
 * @returns les sections non vides, dans l'ordre d'affichage
 */
export function segmenter(
  tournois: TournamentSummary[],
  filtre: FiltreStatut = 'tous',
): SectionTournois[] {
  const retenus = tournois.filter((t) => filtre === 'tous' || t.status === filtre)

  const miens = retenus.filter(estEngage)
  const autres = retenus.filter((t) => !estEngage(t))

  const sections: SectionTournois[] = [
    {
      cle: 'miens',
      titre: 'Mes tournois',
      description: 'Ceux que vous organisez ou auxquels vous participez.',
      tournois: miens,
    },
    {
      cle: 'ouverts',
      titre: 'Ouverts aux inscriptions',
      description: 'Pas encore commencés : vous pouvez encore rejoindre.',
      // Un brouillon qui n'est pas le vôtre n'est pas annoncé : il n'est pas
      // prêt, et le proposer promettrait une inscription impossible.
      tournois: autres.filter((t) => OUVERTS.includes(t.status)),
    },
    {
      cle: 'encours',
      titre: 'En cours',
      description: 'Déjà commencés — consultables, mais les inscriptions sont closes.',
      tournois: autres.filter((t) => t.status === 'ongoing'),
    },
    {
      cle: 'termines',
      titre: 'Terminés',
      description: 'Résultats et classements définitifs.',
      tournois: autres.filter((t) => CLOS.includes(t.status)),
    },
  ]

  // Une section vide n'apporte rien : un titre sans contenu fait croire à un
  // chargement incomplet.
  return sections.filter((s) => s.tournois.length > 0)
}
