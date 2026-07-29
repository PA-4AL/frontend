import { describe, expect, it } from 'vitest'
import { peutDemarrerUnGlissement } from './bracketDrag'

/**
 * Régression : le viewport capturait le pointeur même au-dessus d'un bouton, ce
 * qui redirigeait le `click` vers le viewport. Le bouton « Générer le bracket »
 * était inerte, sans erreur ni requête réseau — le pire mode de défaillance,
 * puisque rien ne signalait le problème.
 */
describe('peutDemarrerUnGlissement', () => {
  function cible(html: string, selecteur: string): Element {
    const hote = document.createElement('div')
    hote.innerHTML = html
    const trouve = hote.querySelector(selecteur)
    if (!trouve) throw new Error(`cible introuvable : ${selecteur}`)
    return trouve
  }

  it('laisse glisser sur la surface du bracket', () => {
    expect(peutDemarrerUnGlissement(cible('<div class="bracket-surface"></div>', '.bracket-surface')))
      .toBe(true)
  })

  it('ne glisse pas sur un bouton', () => {
    expect(peutDemarrerUnGlissement(cible('<button>Générer</button>', 'button'))).toBe(false)
  })

  it('ne glisse pas sur un sélecteur de format', () => {
    expect(peutDemarrerUnGlissement(cible('<select><option>a</option></select>', 'select'))).toBe(false)
  })

  it('ne glisse pas sur le contenu d’un bouton', () => {
    // Le clic atterrit souvent sur un enfant (icône, span), pas sur le bouton.
    expect(peutDemarrerUnGlissement(cible('<button><span>Générer</span></button>', 'span'))).toBe(false)
  })

  it('ne glisse pas dans une zone marquée data-no-drag', () => {
    // Exclure un conteneur entier évite d’énumérer ce qu’il contient — c’est
    // l’oubli d’un cas particulier qui avait produit le défaut.
    const html = '<div data-no-drag><p class="aide">Une défaite élimine.</p></div>'
    expect(peutDemarrerUnGlissement(cible(html, '.aide'))).toBe(false)
  })

  it('conserve les exclusions historiques : carte de match et barre de zoom', () => {
    expect(peutDemarrerUnGlissement(cible('<div class="bm-team"></div>', '.bm-team'))).toBe(false)
    expect(peutDemarrerUnGlissement(cible('<div class="zoom-bar"></div>', '.zoom-bar'))).toBe(false)
  })

  it('ne glisse pas sans cible exploitable', () => {
    expect(peutDemarrerUnGlissement(null)).toBe(false)
  })
})
