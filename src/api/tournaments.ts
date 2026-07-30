import { apiGet, apiPost, v1 } from './client'
import type {
  ActivityItem,
  Annonce,
  BracketData,
  DashboardKpis,
  Job,
  Participant,
  PendingRegistration,
  TournamentDetail,
  TournamentSummary,
} from './types'

export function fetchTournaments(): Promise<TournamentSummary[]> {
  return apiGet(v1('/tournaments'))
}

export function fetchTournament(id: string): Promise<TournamentDetail> {
  return apiGet(v1(`/tournaments/${id}`))
}

export function fetchBracket(tournamentId: string): Promise<BracketData> {
  return apiGet(v1(`/tournaments/${tournamentId}/bracket`))
}

export function fetchDashboardKpis(): Promise<DashboardKpis> {
  return apiGet(v1('/dashboard/kpis'))
}

export function fetchActivity(): Promise<ActivityItem[]> {
  return apiGet(v1('/dashboard/activity'))
}

export interface GameSpec {
  name: string
  bestOf: number
}

export interface CreateTournamentInput {
  name: string
  description?: string
  games: GameSpec[]
  format: string
  teamSize: number
  maxParticipants?: number
  visibility: 'public' | 'private'
  startAt?: string
}

export function createTournament(input: CreateTournamentInput): Promise<TournamentSummary> {
  return apiPost(v1('/tournaments'), input)
}

export function generateBracket(tournamentId: string, format?: string): Promise<BracketData> {
  return apiPost(v1(`/tournaments/${tournamentId}/bracket/generate`), format ? { format } : {})
}

/**
 * Soumet l'export .xlsx du tournoi. Traitement **asynchrone** délégué au worker
 * Rust : la réponse est un job à suivre par `fetchJob`, pas le fichier.
 */
export function exportTournament(tournamentId: string): Promise<Job> {
  return apiPost(v1(`/tournaments/${tournamentId}/export`), {})
}

/**
 * Importe des équipes depuis un fichier Excel.
 *
 * `columns` désigne la colonne de chaque donnée (`{"Équipe": "A", …}`) : les
 * libellés du fichier n'ont alors plus d'importance. Traitement **asynchrone** —
 * la réponse est un job à suivre par [fetchJob].
 */
export function importTeams(req: {
  tournamentId: string
  tournamentType: string
  fileBase64: string
  columns: Record<string, string>
  hasHeader: boolean
}): Promise<Job> {
  return apiPost(v1('/teams/import'), req)
}

/** Cloche : annonces des tournois où l'on est engagé, et compteur de non-lues. */
export function fetchMesAnnonces(): Promise<{ annonces: Annonce[]; nonLues: number }> {
  return apiGet(v1('/announcements'))
}

export function marquerAnnoncesLues(): Promise<void> {
  return apiPost(v1('/announcements/seen'), {})
}

/** Annonces d'un tournoi — publiques, comme le bracket qu'elles commentent. */
export function fetchAnnoncesTournoi(tournamentId: string): Promise<Annonce[]> {
  return apiGet(v1(`/tournaments/${tournamentId}/announcements`))
}

export function fetchJob(jobId: string): Promise<Job> {
  return apiGet(v1(`/jobs/${jobId}`))
}

/**
 * Échange deux emplacements de l'arbre (placement manuel).
 *
 * L'opération est un **échange** et non un écrasement : l'équipe présente à
 * l'arrivée récupère la place libérée. Le backend refuse les cas dangereux —
 * match déjà joué, même équipe deux fois dans un match.
 */
export function swapBracketSlots(
  tournamentId: string,
  from: { matchId: string; slot: number },
  to: { matchId: string; slot: number },
): Promise<BracketData> {
  return apiPost(v1(`/tournaments/${tournamentId}/bracket/swap`), {
    fromMatchId: from.matchId,
    fromSlot: from.slot,
    toMatchId: to.matchId,
    toSlot: to.slot,
  })
}

/**
 * Démarre un match : le passe en cours et publie l'annonce « Début du match ».
 *
 * Action explicite, parce que les matchs d'un même tour ne se jouent pas en même
 * temps — les annoncer tous dès qu'ils deviennent jouables serait faux.
 */
export function startMatch(matchId: string): Promise<BracketData> {
  return apiPost(v1(`/matches/${matchId}/start`), {})
}

export function reportScore(matchId: string, scoreA: number, scoreB: number): Promise<BracketData> {
  return apiPost(v1(`/matches/${matchId}/score`), { scoreA, scoreB })
}

export function fetchParticipants(tournamentId: string): Promise<Participant[]> {
  return apiGet(v1(`/tournaments/${tournamentId}/participants`))
}

export function registerToTournament(tournamentId: string): Promise<Participant> {
  return apiPost(v1(`/tournaments/${tournamentId}/register`), {})
}

export function fetchPendingRegistrations(): Promise<PendingRegistration[]> {
  return apiGet(v1('/registrations/pending'))
}

export function confirmRegistration(registrationId: string): Promise<void> {
  return apiPost(v1(`/registrations/${registrationId}/confirm`), {})
}

export function rejectRegistration(registrationId: string): Promise<void> {
  return apiPost(v1(`/registrations/${registrationId}/reject`), {})
}

export function addParticipant(tournamentId: string, name: string): Promise<Participant> {
  return apiPost(v1(`/tournaments/${tournamentId}/participants`), { name })
}

export function registerTeamToTournament(tournamentId: string, teamId: string): Promise<Participant> {
  return apiPost(v1(`/tournaments/${tournamentId}/register-team`), { teamId })
}

export function setSeed(registrationId: string, seed: number | null): Promise<void> {
  return apiPost(v1(`/registrations/${registrationId}/seed`), { seed })
}
