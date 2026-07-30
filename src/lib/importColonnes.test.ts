import { describe, expect, it } from 'vitest'
import {
  COLONNES_ATTENDUES,
  MAX_FICHIER_OCTETS,
  erreurDeMapping,
  mappingMemorise,
  mappingParDefaut,
  memoriserMapping,
  resumeDuMapping,
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

describe('resumeDuMapping', () => {
  it('récapitule le choix en une phrase vérifiable', () => {
    // Relire trois listes déroulantes pour contrôler son réglage est pénible ;
    // une phrase se vérifie d'un coup d'œil.
    expect(resumeDuMapping(['Équipe', 'Pseudo'], { 'Équipe': 'B', 'Pseudo': 'D' }))
      .toBe('Équipe en B · Pseudo en D')
  })
})

describe('mémoire du mapping', () => {
  it('restitue le dernier mapping utilisé', () => {
    const mapping = { 'Équipe': 'B', 'Pseudo': 'D', 'Rang': 'E' }
    memoriserMapping('esport_5v5', mapping)
    expect(mappingMemorise('esport_5v5')).toEqual(mapping)
  })

  it('ignore un mapping qui ne couvre plus les colonnes attendues', () => {
    // Gabarit modifié depuis la dernière fois : appliquer un réglage incomplet
    // en silence produirait un import faux. Mieux vaut la valeur par défaut.
    localStorage.setItem('pa-import-mapping-esport_5v5', JSON.stringify({ 'Équipe': 'A' }))
    expect(mappingMemorise('esport_5v5')).toBeNull()
  })

  it('ignore un contenu illisible plutôt que de lever', () => {
    localStorage.setItem('pa-import-mapping-esport_5v5', 'ceci n’est pas du json')
    expect(mappingMemorise('esport_5v5')).toBeNull()
  })

  it('rend null quand rien n’a été mémorisé', () => {
    localStorage.removeItem('pa-import-mapping-football_11v11')
    expect(mappingMemorise('football_11v11')).toBeNull()
  })
})

describe('MAX_FICHIER_OCTETS', () => {
  it('laisse de la marge sous la limite Pub/Sub de 10 Mo', () => {
    // Le base64 gonfle d'un tiers : un fichier de 6,5 Mo pèse ~8,7 Mo encodé.
    expect(MAX_FICHIER_OCTETS * (4 / 3)).toBeLessThan(10_000_000)
  })
})
