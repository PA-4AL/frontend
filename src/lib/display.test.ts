import { describe, expect, it } from 'vitest'
import { Display } from './display'

describe('Display', () => {
  it('génère des initiales de deux caractères maximum', () => {
    expect(Display.initials('Team Solo')).toBe('TS')
    expect(Display.initials('les_petits.poneys')).toBe('LP')
    expect(Display.initials('Nova')).toBe('N')
  })

  it('retombe sur ? quand le nom est vide', () => {
    expect(Display.initials('')).toBe('?')
    expect(Display.initials('   ')).toBe('?')
  })

  it('boucle sur la palette de couleurs', () => {
    expect(Display.colorFor(0)).toBe(Display.colorFor(8))
    expect(Display.colorFor(1)).not.toBe(Display.colorFor(0))
  })

  it('reste cohérent avec les initiales du backend', () => {
    // Le backend (Display.initials, Kotlin) applique les mêmes règles :
    // séparateurs espace/point/underscore/tiret, 2 caractères, majuscules.
    expect(Display.initials('alpha-beta')).toBe('AB')
  })
})
