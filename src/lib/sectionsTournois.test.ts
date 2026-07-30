import { describe, expect, it } from 'vitest'
import { estEngage, segmenter } from './sectionsTournois'
import type { TournamentSummary } from '../api/types'

function tournoi(p: Partial<TournamentSummary> & { id: string }): TournamentSummary {
  return {
    name: 'T', code: '#A', format: 'single_elim', participants: 0, maxParticipants: 8,
    status: 'registration', scheduleLabel: '', ...p,
  } as TournamentSummary
}

const cles = (sections: ReturnType<typeof segmenter>) => sections.map((s) => s.cle)
const ids = (sections: ReturnType<typeof segmenter>, cle: string) =>
  sections.find((s) => s.cle === cle)?.tournois.map((t) => t.id) ?? []

describe('segmenter', () => {
  it('sépare ce qui est en cours ou terminé de ce qui est ouvert', () => {
    // L'exigence : ne pas mélanger les tournois auxquels on peut s'inscrire avec
    // ceux qui sont déjà commencés ou finis. Ce ne sont pas les mêmes intentions.
    const sections = segmenter([
      tournoi({ id: 'ouvert', status: 'registration' }),
      tournoi({ id: 'encours', status: 'ongoing' }),
      tournoi({ id: 'fini', status: 'finished' }),
    ])

    expect(cles(sections)).toEqual(['ouverts', 'encours', 'termines'])
    expect(ids(sections, 'ouverts')).toEqual(['ouvert'])
    expect(ids(sections, 'encours')).toEqual(['encours'])
    expect(ids(sections, 'termines')).toEqual(['fini'])
  })

  it('regroupe dans « mes tournois » ceux où l’on est engagé, quel que soit leur statut', () => {
    const sections = segmenter([
      tournoi({ id: 'jorganise', status: 'draft', viewerIsOrganizer: true }),
      tournoi({ id: 'jyjoue', status: 'ongoing', viewerIsRegistered: true }),
      tournoi({ id: 'jaifini', status: 'finished', viewerIsRegistered: true }),
    ])

    expect(cles(sections)).toEqual(['miens'])
    expect(ids(sections, 'miens')).toEqual(['jorganise', 'jyjoue', 'jaifini'])
  })

  it('n’annonce pas le brouillon d’un autre', () => {
    // Un brouillon n'est pas prêt : le proposer promettrait une inscription
    // impossible. Le sien reste visible, dans « mes tournois ».
    const sections = segmenter([tournoi({ id: 'brouillon-autre', status: 'draft' })])

    expect(sections).toEqual([])
  })

  it('ne rend aucune section vide', () => {
    // Un titre sans contenu fait croire à un chargement incomplet.
    expect(segmenter([])).toEqual([])
    expect(segmenter([tournoi({ id: 'a', status: 'ongoing' })]).length).toBe(1)
  })

  it('le filtre de statut s’applique à l’intérieur des sections', () => {
    const tournois = [
      tournoi({ id: 'mien-ouvert', status: 'registration', viewerIsRegistered: true }),
      tournoi({ id: 'mien-fini', status: 'finished', viewerIsRegistered: true }),
      tournoi({ id: 'autre-ouvert', status: 'registration' }),
    ]

    const sections = segmenter(tournois, 'finished')

    expect(cles(sections)).toEqual(['miens'])
    expect(ids(sections, 'miens')).toEqual(['mien-fini'])
  })

  it('un check-in en cours reste dans les tournois ouverts', () => {
    // Le check-in précède le coup d'envoi : on peut encore rejoindre selon le
    // règlement du tournoi, il n'a donc pas sa place avec les « en cours ».
    const sections = segmenter([tournoi({ id: 'checkin', status: 'check_in' })])

    expect(cles(sections)).toEqual(['ouverts'])
  })

  it('un tournoi annulé rejoint les terminés', () => {
    const sections = segmenter([tournoi({ id: 'annule', status: 'cancelled' })])

    expect(cles(sections)).toEqual(['termines'])
  })
})

describe('estEngage', () => {
  it('reconnaît l’organisateur et le participant', () => {
    expect(estEngage(tournoi({ id: 'a', viewerIsOrganizer: true }))).toBe(true)
    expect(estEngage(tournoi({ id: 'b', viewerIsRegistered: true }))).toBe(true)
  })

  it('est faux par défaut, sans drapeau', () => {
    // Cas du visiteur non authentifié : le serveur n'annote rien, tout est « autre ».
    expect(estEngage(tournoi({ id: 'c' }))).toBe(false)
  })
})
