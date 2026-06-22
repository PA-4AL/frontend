/* Helpers d'affichage partagés (mêmes conventions que le backend). */

const PALETTE = [
  '#1437D9', '#FF5C28', '#00A854', '#7c3aed',
  '#0891b2', '#db2777', '#ca8a04', '#16a34a',
]

export const Display = {
  colorFor(index: number): string {
    return PALETTE[index % PALETTE.length]
  },

  initials(name: string): string {
    return (
      name
        .split(/[\s._-]+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'
    )
  },
}
