import type { TGameType, TGameConfig } from '../../../shared/types/common/game'
import type { RoomPlayer } from '../../../shared/types/common/room'
import type { AvalonGameState } from '../../../shared/types/games/avalon/state'
import type { Player } from '../../../shared/types/games/avalon/player'
import type { TGameEngine, TGameCreateResult } from '../registry'
import { assignRoles, computeVisibility } from './role-assignment'
import { MIN_PLAYERS, MAX_PLAYERS } from './presets'

/**
 * Avalon game engine. v0.1.6 implements initialization only:
 * role assignment + first-night visibility. The turn-based state machine
 * (selectTeam → votingForTeam → onMission → …) lands in the next version.
 */
export const avalonEngine: TGameEngine = {
  gameType: 'avalon' satisfies TGameType,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,

  createGame(roomId: string, players: RoomPlayer[], config: TGameConfig): TGameCreateResult {
    const ids = players.map(p => p.id)
    const { assignment, settings } = assignRoles(ids, config)
    const visibility = computeVisibility(assignment)

    const state: AvalonGameState = {
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

    return { state, visibility }
  },
}
