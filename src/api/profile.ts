import { apiDelete, apiGet, apiPatch, apiPost, v1 } from './client'
import type { GameAccount, Profile, Team } from './types'

export function fetchProfile(): Promise<Profile> {
  return apiGet(v1('/me'))
}

export function updateProfile(patch: { pseudo?: string; avatarUrl?: string }): Promise<Profile> {
  return apiPatch(v1('/me'), patch)
}

export function addGameAccount(game: string, identifier: string): Promise<GameAccount> {
  return apiPost(v1('/me/game-accounts'), { game, identifier })
}

export function deleteGameAccount(id: string): Promise<void> {
  return apiDelete(v1(`/me/game-accounts/${id}`))
}

/* ---- Équipes ---- */

export function fetchMyTeams(): Promise<Team[]> {
  return apiGet(v1('/teams/mine'))
}

export function createTeam(name: string, tag?: string): Promise<Team> {
  return apiPost(v1('/teams'), { name, tag })
}

export function addTeamMember(teamId: string, pseudo: string, role = 'member'): Promise<Team> {
  return apiPost(v1(`/teams/${teamId}/members`), { pseudo, role })
}

export function removeTeamMember(teamId: string, memberId: string): Promise<Team> {
  return apiDelete(v1(`/teams/${teamId}/members/${memberId}`))
}
