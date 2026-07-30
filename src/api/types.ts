/* Types alignés sur le schéma de BDD de la spec (docs/PA-Tournament-Specs.md §6). */

export type TournamentStatus =
  | 'draft'
  | 'registration'
  | 'check_in'
  | 'ongoing'
  | 'finished'
  | 'cancelled'

export type PhaseType = 'single_elim' | 'double_elim' | 'round_robin' | 'swiss'

export type MatchStatus = 'pending' | 'ongoing' | 'finished' | 'disputed' | 'forfeited'

export interface TournamentSummary {
  id: string
  name: string
  code: string
  format: PhaseType
  participants: number
  maxParticipants: number
  status: TournamentStatus
  scheduleLabel: string
}

export interface TournamentDetail extends TournamentSummary {
  description: string
  game: string
  teamSize: number
  organizer: string
  bestOf: number
  checkInWindow: string
  region: string
  visibility: 'public' | 'private'
  cashPrize: string
  currentPhaseLabel: string
  startedLabel: string
  matchesPlayed: number
  matchesTotal: number
  remainingTeams: BracketTeamRef[]
  currentMatches: MatchRow[]
}

export interface BracketTeamRef {
  code: string
  name: string
  color: string
}

export interface MatchRow {
  id: string
  teamA: BracketTeamRef
  teamB: BracketTeamRef
  scoreA: number | null
  scoreB: number | null
  status: 'live' | 'done' | 'scheduled'
  time?: string
}

/* ---- Bracket ---- */

export interface BracketSlot {
  tbd?: boolean
  name: string
  seed?: number
  code?: string
  color?: string
  score?: number | null
  win?: boolean
}

export interface BracketMatch {
  id: string
  /** UUID réel du match côté backend (saisie de score) */
  matchId?: string
  status: 'done' | 'live' | 'scheduled' | 'pending'
  time?: string
  a: BracketSlot
  b: BracketSlot
}

export interface BracketRound {
  label: string
  matches: BracketMatch[]
}

export interface BracketData {
  rounds: BracketRound[]
  champion: string | null
}

/* ---- Inscriptions ---- */

export type RegistrationStatus =
  | 'pending'
  | 'confirmed'
  | 'waitlist'
  | 'checked_in'
  | 'withdrawn'
  | 'disqualified'

export interface Participant {
  registrationId: string
  name: string
  status: RegistrationStatus
  seed: number | null
  registeredLabel: string
  /** Classement final, 1 = vainqueur ; absent tant que le tournoi n'est pas terminé. */
  finalRank?: number | null
}

export interface PendingRegistration {
  registrationId: string
  participant: string
  tournamentId: string
  tournamentName: string
  status: 'pending' | 'waitlist'
  registeredLabel: string
}

/* ---- Profil ---- */

export interface GameAccount {
  id: string
  game: string
  identifier: string
}

export interface TournamentHistory {
  tournamentId: string
  name: string
  game: string
  status: TournamentStatus
  result: 'champion' | 'in_progress' | 'eliminated' | 'registered'
  matchesWon: number
  matchesPlayed: number
}

export interface Profile {
  pseudo: string
  email: string | null
  avatarUrl: string | null
  gameAccounts: GameAccount[]
  history: TournamentHistory[]
  stats: {
    tournamentsPlayed: number
    matchesPlayed: number
    matchesWon: number
    winrate: number
  }
}

/* ---- Équipes ---- */

export interface TeamMember {
  userId: string
  pseudo: string
  role: 'captain' | 'member' | 'substitute'
}

export interface Team {
  id: string
  name: string
  tag: string | null
  members: TeamMember[]
  /** Calculé par le serveur : l'appelant est-il capitaine ? (pas déduit du pseudo) */
  viewerIsCaptain?: boolean
}

/* ---- Dashboard ---- */

export interface DashboardKpis {
  activeTournaments: number
  activeTournamentsDelta: string
  liveMatches: number
  participants: number
  participantsDelta: string
  pendingValidations: number
}

export interface ActivityItem {
  id: string
  kind: 'win' | 'live' | 'registration' | 'dispute' | 'finished'
  /** Ce dont on parle : participant ou tournoi. Mis en valeur à l'affichage. */
  sujet: string
  /** Ce qui s'est passé — texte fixe venant du serveur. */
  action: string
  /** Précision optionnelle, par exemple le tournoi concerné. */
  complement?: string | null
  time: string
}

/**
 * Traitement asynchrone délégué au worker Rust (import/export Excel).
 *
 * Le fichier produit revient dans `result.file_base64` — le worker le renvoie
 * encodé dans le message Pub/Sub, il n'y a pas de stockage objet intermédiaire.
 */
export interface Job {
  id: string
  type: string
  /** `pending` | `processing` | `done` | `failed` */
  status: string
  error?: string | null
  result?: {
    file_base64?: string
    filename?: string
    /** Import : nombre d'équipes et de joueurs créés. */
    team_count?: number
    player_count?: number
    [k: string]: unknown
  } | null
}
