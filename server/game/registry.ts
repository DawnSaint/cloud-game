import type { TGameType, TGameConfig } from '../../shared/types/common/game'
import type { RoomPlayer } from '../../shared/types/common/room'
import type { AvalonGameState } from '../../shared/types/games/avalon/state'
import type { TAvalonEvent, TAvalonEventResult } from '../../shared/types/games/avalon/events'
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
 * Inputs to `TGameEngine.getVisualState`. v0.1.7 passes the first-night
 * visibility map through unchanged; future add-on roles may need richer
 * context (mid-game reveals), which can extend this interface then.
 */
export interface TGameVisualInputs {
  playerId: string
  visibility: TVisibilityMap
}

/**
 * Contract every game engine implements.
 *
 * v0.1.6 shipped initialization (`createGame`). v0.1.7 adds the round
 * state-machine surface (`handleEvent` / `getVisualState`) so the engine
 * is ready to be plugged into the Socket.IO dispatcher when `startGame`
 * lands in the next milestone — see `docs/roadmap.md`.
 *
 * Concrete types are used for now; when a second game ships we'll genericize
 * via `<TState, TEvent>` so each engine can keep its own state shape.
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
  /**
   * Apply a game event to the authoritative state. Returns either the new
   * immutable state or a validation error code (no throw on validator
   * failures so the dispatcher can surface it to the caller without try/catch).
   */
  handleEvent(state: AvalonGameState, event: TAvalonEvent, actorId: string): TAvalonEventResult
  /**
   * Build the per-observer state slice. During play, server-secret roles are
   * replaced by visibility-map entries (or 'unknown'); after stage is 'end'
   * all roles reveal.
   */
  getVisualState(state: AvalonGameState, inputs: TGameVisualInputs): AvalonGameState
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
