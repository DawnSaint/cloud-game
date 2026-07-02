import type { TGameType, TGameConfig } from '../../../shared/types/common/game'
import type { RoomPlayer } from '../../../shared/types/common/room'
import type { AvalonGameState } from '../../../shared/types/games/avalon/state'
import type { TAvalonEvent, TAvalonEventResult } from '../../../shared/types/games/avalon/events'
import type { Player } from '../../../shared/types/games/avalon/player'
import type { TVisibleRole } from '../../../shared/types/games/avalon/roles'
import type { TGameEngine, TGameCreateResult, TGameVisualInputs } from '../registry'
import { assignRoles, computeVisibility } from './role-assignment'
import { applyEvent, initializeRoundRuntime, nextLeaderId } from './state-machine'
import { MIN_PLAYERS, MAX_PLAYERS } from './presets'

/**
 * Avalon game engine. v0.1.7 lands the round state-machine
 * (initialization → selectTeam → votingForTeam → onMission → 循环/结束)
 * on top of the v0.1.6 initialization surface.
 *
 * The engine is pure: no Socket.IO, no timers. The room layer owns the
 * authoritative state and calls `handleEvent` whenever a client action
 * arrives. `getVisualState` produces the per-observer slice right before
 * broadcast so server-secret roles never leak.
 */
export const avalonEngine: TGameEngine = {
  gameType: 'avalon' satisfies TGameType,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(roomId: string, players: RoomPlayer[], config: TGameConfig): TGameCreateResult {
    const ids = players.map(p => p.id)
    const { assignment, settings } = assignRoles(ids, config)
    const visibility = computeVisibility(assignment)

    const baseState: AvalonGameState = {
      uuid: roomId,
      stage: 'initialization',
      vote: 0,
      mission: 0,
      missionState: settings.missions.map(m => ({ players: m.players, failsRequired: m.failsRequired })),
      settings,
      history: [],
      players: assignment.map((a, i): Player => ({
        index: i,
        id: a.playerId,
        // 服务端权威状态保留真实角色；按玩家视角的裁剪由 visibility map 驱动。
        role: a.role,
        features: {},
      })),
    }

    // Pick a random initial leader from the seating order so v0.1.7 runs
    // are reproducible by tests only via direct seeding — production randomness
    // is fine for now (no first-player advantage claim in v0.1.7).
    const initialLeaderId = ids[Math.floor(Math.random() * ids.length)]!
    const state = initializeRoundRuntime(baseState, initialLeaderId)
    return { state, visibility }
  },

  handleEvent(state: AvalonGameState, event: TAvalonEvent, actorId: string): TAvalonEventResult {
    return applyEvent(state, event, actorId)
  },

  getVisualState(state: AvalonGameState, inputs: TGameVisualInputs): AvalonGameState {
    const { playerId, visibility } = inputs
    const revealAll = state.stage === 'end'
    const roleFor = (targetId: string): TVisibleRole => {
      if (revealAll) return state.players.find(p => p.id === targetId)!.role
      if (targetId === playerId) {
        return state.players.find(p => p.id === targetId)!.role
      }
      return visibility[playerId]?.[targetId] ?? 'unknown'
    }
    return {
      ...state,
      // Result / settings are public once the game is over; keep result
      // visible during play too since it reflects only past mission outcomes.
      players: state.players.map(p => ({ ...p, role: roleFor(p.id) })),
    }
  },
}

export { nextLeaderId }
