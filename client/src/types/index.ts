export interface User {
  userId: string
  username: string
  createdAt: string
}

export interface Room {
  _id: string
  name: string
  host: string
  players: Player[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  gameType: string
  createdAt: string
}

export interface Player {
  userId: string
  username: string
  isReady: boolean
  isHost: boolean
}

export interface GameState {
  phase: string
  currentRound: number
  currentLeader: string
  teamProposal?: string[]
  votes?: Record<string, boolean>
  missionResults?: boolean[]
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
