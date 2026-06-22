import { apiDelete, apiGet, apiPatch, apiPost } from './client'
import type { GameAccount, Profile, Team } from './types'

export function fetchProfile(): Promise<Profile> {
  return apiGet('/api/me')
}

export function updateProfile(patch: { pseudo?: string; avatarUrl?: string }): Promise<Profile> {
  return apiPatch('/api/me', patch)
}

export function addGameAccount(game: string, identifier: string): Promise<GameAccount> {
  return apiPost('/api/me/game-accounts', { game, identifier })
}

export function deleteGameAccount(id: string): Promise<void> {
  return apiDelete(`/api/me/game-accounts/${id}`)
}

/* ---- Équipes ---- */

export function fetchMyTeams(): Promise<Team[]> {
  return apiGet('/api/teams/mine')
}

export function createTeam(name: string, tag?: string): Promise<Team> {
  return apiPost('/api/teams', { name, tag })
}

export function addTeamMember(teamId: string, pseudo: string, role = 'member'): Promise<Team> {
  return apiPost(`/api/teams/${teamId}/members`, { pseudo, role })
}

export function removeTeamMember(teamId: string, memberId: string): Promise<Team> {
  return apiDelete(`/api/teams/${teamId}/members/${memberId}`)
}
