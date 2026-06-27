import type { GameSettings } from '../../../shared/types/games/avalon/settings'

/** Avalon supports 5–10 players. */
export const MIN_PLAYERS = 5
export const MAX_PLAYERS = 10

/**
 * Per-player-count presets: mission sizes (5 rounds) + good/evil seat split.
 * Ported from `_reference/packages/backend/src/core/game/const.ts` (gamesSettings).
 */
export const GAMES_SETTINGS: Record<number, GameSettings> = {
  5: {
    missions: [
      { players: 2, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 2, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
    ],
    players: { good: 3, evil: 2 },
    total: 5,
  },
  6: {
    missions: [
      { players: 2, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
    ],
    players: { good: 4, evil: 2 },
    total: 6,
  },
  7: {
    missions: [
      { players: 2, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 2 },
      { players: 4, failsRequired: 1 },
    ],
    players: { good: 4, evil: 3 },
    total: 7,
  },
  8: {
    missions: [
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 5, failsRequired: 2 },
      { players: 5, failsRequired: 1 },
    ],
    players: { good: 5, evil: 3 },
    total: 8,
  },
  9: {
    missions: [
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 5, failsRequired: 2 },
      { players: 5, failsRequired: 1 },
    ],
    players: { good: 6, evil: 3 },
    total: 9,
  },
  10: {
    missions: [
      { players: 3, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 4, failsRequired: 1 },
      { players: 5, failsRequired: 2 },
      { players: 5, failsRequired: 1 },
    ],
    players: { good: 6, evil: 4 },
    total: 10,
  },
}
