import { describe, expect, it } from 'vitest'
import { base64EnOctets, jobTermine, nomDeFichier } from './telechargement'

describe('base64EnOctets', () => {
  it('restitue les octets exacts', () => {
    // "PK\x03\x04" : la signature d'un fichier .xlsx (archive ZIP). Si le décodage
    // passait par UTF-8, ces octets seraient corrompus et le fichier illisible.
    expect(Array.from(base64EnOctets('UEsDBA=='))).toEqual([0x50, 0x4b, 0x03, 0x04])
  })

  it('tolère les retours à la ligne d’un base64 découpé', () => {
    expect(Array.from(base64EnOctets('UEsD\nBA==\n'))).toEqual([0x50, 0x4b, 0x03, 0x04])
  })

  it('gère les octets hauts sans les tronquer', () => {
    // 0xFF est le cas qui casse une conversion naïve en chaîne UTF-8.
    expect(Array.from(base64EnOctets('/w=='))).toEqual([0xff])
  })

  it('rend un tableau vide pour une chaîne vide', () => {
    expect(base64EnOctets('').length).toBe(0)
  })
})

describe('nomDeFichier', () => {
  it('retire les accents et les séparateurs', () => {
    // Un nom de tournoi contient volontiers des « — » ou des « / », qui ne
    // peuvent pas se retrouver dans un nom de fichier.
    expect(nomDeFichier('Ancients Open — Dota 2')).toBe('ancients-open-dota-2.xlsx')
    expect(nomDeFichier('Été / Hiver')).toBe('ete-hiver.xlsx')
  })

  it('garantit un nom même si tout est retiré', () => {
    expect(nomDeFichier('///')).toBe('tournoi.xlsx')
    expect(nomDeFichier('')).toBe('tournoi.xlsx')
  })

  it('ne laisse pas de tiret en tête ni en fin', () => {
    expect(nomDeFichier(' PA Major ')).toBe('pa-major.xlsx')
  })
})

describe('jobTermine', () => {
  it('reconnaît les deux états terminaux', () => {
    expect(jobTermine('done')).toBe(true)
    expect(jobTermine('failed')).toBe(true)
  })

  it('continue d’attendre sur les états intermédiaires', () => {
    // `failed` compte comme terminal : sans cela, l'interface attendrait un
    // fichier qui n'arrivera jamais au lieu d'afficher l'erreur du worker.
    expect(jobTermine('pending')).toBe(false)
    expect(jobTermine('processing')).toBe(false)
  })
})
