/**
 * Récupération du fichier produit par le worker.
 *
 * L'export est **asynchrone** : le backend rend un job, le worker travaille, et
 * le fichier revient encodé en base64 dans le résultat du job. Il n'y a pas de
 * stockage objet intermédiaire — le fichier transite par le message Pub/Sub,
 * plafonné à 10 Mo.
 *
 * Ces fonctions sont isolées de React pour être testables : la conversion
 * base64 → octets est exactement le genre de code qu'on croit trivial et qui
 * tronque silencieusement un fichier.
 */

/** Décode une chaîne base64 en octets. */
export function base64EnOctets(base64: string): Uint8Array {
  // `atob` rend une chaîne dont chaque caractère porte un octet : le passage par
  // charCodeAt est nécessaire, une conversion directe en UTF-8 corromprait le
  // binaire.
  const brut = atob(base64.replace(/\s/g, ''))
  const octets = new Uint8Array(brut.length)
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i)
  return octets
}

/**
 * Nom de fichier sûr : accents et séparateurs retirés, extension garantie.
 * Un nom de tournoi contient volontiers des `/` ou des `—`.
 */
export function nomDeFichier(nomTournoi: string): string {
  const base = nomTournoi
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `${base || 'tournoi'}.xlsx`
}

/** État terminal d'un job : inutile de continuer à l'interroger. */
export function jobTermine(statut: string): boolean {
  return statut === 'done' || statut === 'failed'
}
