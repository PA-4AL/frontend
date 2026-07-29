/**
 * Correspondance entre les données attendues et les colonnes d'un fichier Excel.
 *
 * Le worker sait retrouver les colonnes par leur **en-tête**, mais cela oblige
 * l'organisateur à renommer les siennes avant d'importer. Il reçoit ses
 * inscriptions dans le format que ses joueurs veulent bien lui envoyer : il est
 * plus juste de lui demander *où* se trouve chaque donnée que de lui demander de
 * réécrire son fichier.
 *
 * Les libellés ci-dessous sont ceux que le worker attend comme clés du mapping —
 * ils viennent de `worker/src/parser/*.rs` et doivent y rester identiques,
 * accents compris.
 */

/** Colonnes attendues selon le gabarit de fichier, dans l'ordre d'affichage. */
export const COLONNES_ATTENDUES: Record<string, string[]> = {
  esport_5v5: ['Équipe', 'Pseudo', 'Rang'],
  football_11v11: ['Équipe', 'Nom', 'Prénom', 'Poste', 'Numéro'],
}

/** Références de colonne proposées. Au-delà de T, la saisie devient illisible. */
export const LETTRES = 'ABCDEFGHIJKLMNOPQRST'.split('')

/**
 * Gabarit de fichier déduit de la taille d'équipe — même règle que le backend
 * (`ExportService.typeDeFichier`) : 11 joueurs relèvent du football, le reste de
 * l'esport. Le worker ne connaît que ces deux gabarits.
 */
export function typeDeFichierPour(teamSize: number | undefined): string {
  return teamSize === 11 ? 'football_11v11' : 'esport_5v5'
}

/** Proposition initiale : les colonnes dans l'ordre, A, B, C… */
export function mappingParDefaut(colonnes: string[]): Record<string, string> {
  return Object.fromEntries(colonnes.map((c, i) => [c, LETTRES[i] ?? LETTRES[0]]))
}

/**
 * Ce qui empêche un import d'aboutir, ou `null` si tout est en ordre.
 *
 * La même lettre affectée deux fois est le piège principal : le worker lirait la
 * même colonne pour deux données et produirait des joueurs dont le pseudo vaut
 * le nom de l'équipe, sans rien signaler.
 */
export function erreurDeMapping(
  colonnes: string[],
  mapping: Record<string, string>,
): string | null {
  const manquantes = colonnes.filter((c) => !mapping[c])
  if (manquantes.length > 0) {
    return `Colonne non choisie pour : ${manquantes.join(', ')}.`
  }
  const utilisees = colonnes.map((c) => mapping[c])
  const doublons = utilisees.filter((l, i) => utilisees.indexOf(l) !== i)
  if (doublons.length > 0) {
    return `La colonne ${[...new Set(doublons)].join(', ')} est utilisée pour deux données.`
  }
  return null
}

/**
 * Lit un fichier et rend son contenu en base64, sans le préfixe `data:`.
 *
 * `readAsDataURL` plutôt qu'un décodage manuel : le résultat est déjà encodé, et
 * un passage par une chaîne de caractères corromprait les octets d'un `.xlsx`.
 */
export function fichierEnBase64(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onerror = () => reject(new Error('Lecture du fichier impossible.'))
    lecteur.onload = () => {
      const resultat = String(lecteur.result)
      const virgule = resultat.indexOf(',')
      resolve(virgule >= 0 ? resultat.slice(virgule + 1) : resultat)
    }
    lecteur.readAsDataURL(fichier)
  })
}
