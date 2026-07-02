import type { TVoteOption } from './vote';
import type { TMissionResult } from './mission';
import type { AvalonGameState } from './state';
import type { TVisibilityMap } from '../../../server/game/registry';

/**
 * Client-to-server Avalon events processed by `avalonEngine.handleEvent`
 * in v0.1.7. Each event mutates the authoritative `AvalonGameState` and
 * returns either the new state or a validation error.
 *
 * Discriminator: `type`. Payloads travel alongside the discriminator in
 * the same object so engine dispatch stays a single `switch` statement.
 */
export type TAvalonEvent =
  | { type: 'selectPlayer', playerId: string }
  | { type: 'submitTeam' }
  | { type: 'castVote', option: TVoteOption }
  | { type: 'missionAction', result: TMissionResult }

/**
 * Result of applying an event: either a new immutable state or a
 * human-readable error code. Errors are surfaced verbatim to the client so
 * the UI can render them (no i18n yet — codes only).
 */
export type TAvalonEventResult =
  | { state: AvalonGameState }
  | { error: string }

/**
 * Stages that admit new player actions in v0.1.7. Used by the engine
 * itself for early validation and exported for the dispatcher layer so
 * the UI can disable buttons consistently.
 */
export const AVALON_ACTIVE_STAGES = ['selectTeam', 'votingForTeam', 'onMission'] as const

/**
 * Inputs to `avalonEngine.getVisualState`: the observer's playerId plus
 * the first-night visibility map (computed once at `createGame` and
 * reused for every state change).
 */
export interface TAvalonVisualInputs {
  playerId: string
  visibility: TVisibilityMap
}
