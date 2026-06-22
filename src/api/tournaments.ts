import { apiGet, apiPost } from './client'
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
  return apiGet('/api/tournaments')
}

export function fetchTournament(id: string): Promise<TournamentDetail> {
  return apiGet(`/api/tournaments/${id}`)
}

export function fetchBracket(tournamentId: string): Promise<BracketData> {
  return apiGet(`/api/tournaments/${tournamentId}/bracket`)
}

export function fetchDashboardKpis(): Promise<DashboardKpis> {
  return apiGet('/api/dashboard/kpis')
}

export function fetchActivity(): Promise<ActivityItem[]> {
  return apiGet('/api/dashboard/activity')
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
  return apiPost('/api/tournaments', input)
}

export function generateBracket(tournamentId: string, format?: string): Promise<BracketData> {
  return apiPost(`/api/tournaments/${tournamentId}/bracket/generate`, format ? { format } : {})
}

export function reportScore(matchId: string, scoreA: number, scoreB: number): Promise<BracketData> {
  return apiPost(`/api/matches/${matchId}/score`, { scoreA, scoreB })
}

export function fetchParticipants(tournamentId: string): Promise<Participant[]> {
  return apiGet(`/api/tournaments/${tournamentId}/participants`)
}

export function registerToTournament(tournamentId: string): Promise<Participant> {
  return apiPost(`/api/tournaments/${tournamentId}/register`, {})
}

export function fetchPendingRegistrations(): Promise<PendingRegistration[]> {
  return apiGet('/api/registrations/pending')
}

export function confirmRegistration(registrationId: string): Promise<void> {
  return apiPost(`/api/registrations/${registrationId}/confirm`, {})
}

export function rejectRegistration(registrationId: string): Promise<void> {
  return apiPost(`/api/registrations/${registrationId}/reject`, {})
}

export function addParticipant(tournamentId: string, name: string): Promise<Participant> {
  return apiPost(`/api/tournaments/${tournamentId}/participants`, { name })
}

export function registerTeamToTournament(tournamentId: string, teamId: string): Promise<Participant> {
  return apiPost(`/api/tournaments/${tournamentId}/register-team`, { teamId })
}

export function setSeed(registrationId: string, seed: number | null): Promise<void> {
  return apiPost(`/api/registrations/${registrationId}/seed`, { seed })
}
