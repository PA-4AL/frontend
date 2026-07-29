import { describe, expect, it } from 'vitest'
import { estReorganisable, memeEmplacement, prochaineAction, type Emplacement } from './bracketSwap'
import type { BracketMatch, BracketSlot } from '../api/types'

const A: Emplacement = { matchId: 'm1', slot: 1 }
const B: Emplacement = { matchId: 'm2', slot: 2 }

function slot(p: Partial<BracketSlot> = {}): BracketSlot {
  return { name: 'Équipe', ...p } as BracketSlot
}

function match(p: Partial<BracketMatch> = {}): BracketMatch {
  return { id: 'M1', matchId: 'm1', status: 'scheduled', a: slot(), b: slot(), ...p } as BracketMatch
}

describe('prochaineAction', () => {
  it('sélectionne un emplacement occupé quand rien n’est sélectionné', () => {
    expect(prochaineAction(null, A, false)).toEqual({ type: 'selectionner', emplacement: A })
  })

  it('ne sélectionne rien sur un emplacement vide', () => {
    // Un bye ou un vainqueur encore inconnu n'offre rien à saisir. Sélectionner
    // du vide donnerait un échange qui ne déplace personne.
    expect(prochaineAction(null, A, true)).toEqual({ type: 'rien' })
  })

  it('échange vers la destination désignée', () => {
    expect(prochaineAction(A, B, false)).toEqual({ type: 'echanger', de: A, vers: B })
  })

  it('accepte une destination vide : c’est un déplacement', () => {
    expect(prochaineAction(A, B, true)).toEqual({ type: 'echanger', de: A, vers: B })
  })

  it('annule quand on reclique au même endroit', () => {
    // Sans cette porte de sortie, l'utilisateur serait piégé dans sa sélection.
    expect(prochaineAction(A, { ...A }, false)).toEqual({ type: 'annuler' })
  })

  it('distingue les deux slots d’un même match', () => {
    const memeMatchAutreSlot: Emplacement = { matchId: 'm1', slot: 2 }
    expect(prochaineAction(A, memeMatchAutreSlot, false)).toEqual({
      type: 'echanger',
      de: A,
      vers: memeMatchAutreSlot,
    })
  })
})

describe('memeEmplacement', () => {
  it('compare le match et le slot, pas la référence', () => {
    expect(memeEmplacement(A, { matchId: 'm1', slot: 1 })).toBe(true)
    expect(memeEmplacement(A, { matchId: 'm1', slot: 2 })).toBe(false)
    expect(memeEmplacement(A, null)).toBe(false)
  })
})

describe('estReorganisable', () => {
  it('accepte un match à venir ou en attente', () => {
    expect(estReorganisable(match({ status: 'scheduled' }))).toBe(true)
    expect(estReorganisable(match({ status: 'pending' }))).toBe(true)
  })

  it('refuse un match joué : le déplacer invaliderait son résultat', () => {
    expect(estReorganisable(match({ status: 'done' }))).toBe(false)
  })

  it('refuse un match en cours', () => {
    expect(estReorganisable(match({ status: 'live' }))).toBe(false)
  })

  it('refuse un match sans identifiant', () => {
    expect(estReorganisable(match({ matchId: undefined }))).toBe(false)
  })
})
