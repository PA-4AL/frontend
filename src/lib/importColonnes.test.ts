import { describe, expect, it } from 'vitest'
import {
  COLONNES_ATTENDUES,
  erreurDeMapping,
  mappingParDefaut,
  typeDeFichierPour,
} from './importColonnes'

describe('typeDeFichierPour', () => {
  it('suit la même règle que le backend', () => {
    // ExportService.typeDeFichier : 11 → football, tout le reste → esport.
    // Une divergence enverrait au worker un gabarit qui ne correspond pas aux
    // colonnes affichées à l'utilisateur.
    expect(typeDeFichierPour(11)).toBe('football_11v11')
    expect(typeDeFichierPour(5)).toBe('esport_5v5')
    expect(typeDeFichierPour(3)).toBe('esport_5v5')
    expect(typeDeFichierPour(undefined)).toBe('esport_5v5')
  })
})

describe('mappingParDefaut', () => {
  it('propose les colonnes dans l’ordre', () => {
    expect(mappingParDefaut(['Équipe', 'Pseudo', 'Rang'])).toEqual({
      'Équipe': 'A',
      'Pseudo': 'B',
      'Rang': 'C',
    })
  })

  it('couvre le gabarit football, plus large', () => {
    const mapping = mappingParDefaut(COLONNES_ATTENDUES.football_11v11)
    expect(Object.keys(mapping)).toHaveLength(5)
    expect(mapping['Numéro']).toBe('E')
  })
})

describe('erreurDeMapping', () => {
  const colonnes = ['Équipe', 'Pseudo', 'Rang']

  it('accepte un mapping complet et sans doublon', () => {
    expect(erreurDeMapping(colonnes, { 'Équipe': 'A', 'Pseudo': 'C', 'Rang': 'D' })).toBeNull()
  })

  it('refuse deux données sur la même colonne', () => {
    // Le piège principal : le worker lirait la même colonne deux fois et
    // produirait des joueurs dont le pseudo vaut le nom de l'équipe, **sans rien
    // signaler**. Une erreur muette est pire qu'un refus.
    const erreur = erreurDeMapping(colonnes, { 'Équipe': 'A', 'Pseudo': 'A', 'Rang': 'C' })
    expect(erreur).toContain('A')
    expect(erreur).toContain('deux données')
  })

  it('refuse une colonne non choisie', () => {
    const erreur = erreurDeMapping(colonnes, { 'Équipe': 'A', 'Pseudo': 'B' })
    expect(erreur).toContain('Rang')
  })

  it('nomme chaque colonne manquante', () => {
    const erreur = erreurDeMapping(colonnes, { 'Équipe': 'A' })
    expect(erreur).toContain('Pseudo')
    expect(erreur).toContain('Rang')
  })

  it('ne signale qu’une fois une colonne répétée trois fois', () => {
    const erreur = erreurDeMapping(colonnes, { 'Équipe': 'B', 'Pseudo': 'B', 'Rang': 'B' })
    expect(erreur?.match(/B/g)).toHaveLength(1)
  })
})
