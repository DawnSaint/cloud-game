import type { TGameType, TGameConfig } from '../../shared/types/common/game'
import type { RoomPlayer } from '../../shared/types/common/room'
import type { AvalonGameState } from '../../shared/types/games/avalon/state'
import type { TVisibleRole } from '../../shared/types/games/avalon/roles'

/**
 * First-night visibility map: observer playerId -> target playerId -> visible role.
 * Drives the per-client view sanitization (each player sees only what their role permits).
 */
export type TVisibilityMap = Record<string, Record<string, TVisibleRole>>

/** Result of creating a game: authoritative server state + first-night visibility. */
export interface TGameCreateResult {
  state: AvalonGameState
  visibility: TVisibilityMap
}

/**
 * Contract every game engine implements.
 *
 * v0.1.6 ships the initialization surface (gameType / player range / createGame).
 * Turn-based methods (`handleEvent`, `getVisualState`) are added in later versions
 * as game events and the role-reveal UI land — see docs/roadmap.md.
 */
export interface TGameEngine {
  /** Game identifier; matches a `TGameType`. */
  gameType: TGameType
  /** Inclusive min/max player count this engine supports. */
  minPlayers: number
  maxPlayers: number
  /**
   * Initialize a new game: validate config, assign roles, build the authoritative
   * game state (stage `initialization`) and the first-night visibility map.
   * Throws on invalid player count or impossible role configuration.
   */
  createGame(roomId: string, players: RoomPlayer[], config: TGameConfig): TGameCreateResult
}

const engines = new Map<TGameType, TGameEngine>()

/** Register an engine under its gameType. Called at module load by each game package. */
export function registerGame(gameType: TGameType, engine: TGameEngine): void {
  engines.set(gameType, engine)
}

/** Look up the engine for a gameType, or undefined if unregistered. */
export function getGameEngine(gameType: TGameType): TGameEngine | undefined {
  return engines.get(gameType)
}

/** All registered game types. */
export function getAvailableGameTypes(): TGameType[] {
  return [...engines.keys()]
}
