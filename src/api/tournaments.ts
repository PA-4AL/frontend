import { apiGet, apiPost, v1 } from './client'
import type {
  ActivityItem,
  BracketData,
  DashboardKpis,
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
