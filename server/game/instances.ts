import { getIO } from '../utils/socket'
import { getGameEngine } from './registry'
import * as rooms from './rooms'
import * as userService from '../db/user'
import type { TGameConfig } from '../../../shared/types/common/game'
import type { TRoomState } from '../../../shared/types/common/room'
import type { AvalonGameState } from '../../../shared/types/games/avalon/state'
import type { TAvalonEvent, TAvalonEventResult } from '../../../shared/types/games/avalon/events'
import type { TVisibilityMap } from './registry'
import type { RoomError } from '../../../shared/types/api/errors'

/**
 * 每局游戏的权威状态：包含服务端保留的真实角色，以及首夜可见性地图。
 * 该状态绝不直接广播给客户端——广播前必须经过 engine.getVisualState 按玩家裁剪。
 */
export interface GameInstance {
  state: AvalonGameState
  visibility: TVisibilityMap
}

/** 房间 id → 游戏实例。服务端权威状态的唯一来源。 */
const instances = new Map<string, GameInstance>()

/** 获取某房间的游戏实例（若不存在返回 undefined）。 */
export function getInstance(roomId: string): GameInstance | undefined {
  return instances.get(roomId)
}

/** 删除某房间的游戏实例（游戏结束或房间销毁时调用）。 */
export function deleteInstance(roomId: string): void {
  instances.delete(roomId)
}

/** 向房间内每个玩家广播其视角裁剪后的游戏状态。 */
function broadcastGame(roomId: string): void {
  const instance = instances.get(roomId)
  const room = rooms.getRoom(roomId)
  if (!instance || !room) return

  const io = getIO()
  const engine = getGameEngine(room.gameType)
  if (!engine) return

  for (const player of room.players) {
    const visual = engine.getVisualState(instance.state, {
      playerId: player.id,
      visibility: instance.visibility,
    })
    // 向该玩家的个人频道（userId 房间）发送其专属视角。
    io.to(player.id).emit('gameUpdated', visual)
  }
}

/** 仅向指定玩家广播其视角（用于错误恢复后单播）。 */
export function broadcastGameTo(roomId: string, playerId: string): void {
  const instance = instances.get(roomId)
  const room = rooms.getRoom(roomId)
  if (!instance || !room) return
  if (!room.players.some(p => p.id === playerId)) return

  const io = getIO()
  const engine = getGameEngine(room.gameType)
  if (!engine) return

  const visual = engine.getVisualState(instance.state, {
    playerId,
    visibility: instance.visibility,
  })
  io.to(playerId).emit('gameUpdated', visual)
}

/**
 * 启动游戏：校验房间状态与人数，调用引擎 createGame 生成权威状态与可见性地图，
 * 将房间转为 started，广播 roomUpdated + gameUpdated。
 */
export async function startGame(
  roomId: string,
  requesterId: string,
): Promise<RoomError | undefined> {
  const room = rooms.getRoom(roomId)
  if (!room) {
    return { error: 'errorNotFound' }
  }
  if (room.leaderID !== requesterId) {
    return { error: 'errorNotLeader' }
  }
  if (room.stage !== 'locked' && room.stage !== 'created') {
    return { error: 'errorGameAlreadyStarted' }
  }

  const engine = getGameEngine(room.gameType)
  if (!engine) {
    return { error: 'errorNoEngine' }
  }
  const count = room.players.length
  if (count < engine.minPlayers || count > engine.maxPlayers) {
    return { error: 'errorPlayerCount' }
  }

  const { state, visibility } = engine.createGame(roomId, room.players, room.config)

  // 用用户资料填充玩家显示名称与忠诚度（忠诚度仅服务端权威状态保留）。
  const playersWithNames = await Promise.all(
    state.players.map(async (p) => {
      const profile = await userService.getPublicUserProfile(p.id)
      return {
        ...p,
        name: profile?.name,
        loyalty: p.loyalty,
      }
    }),
  )
  const namedState: AvalonGameState = { ...state, players: playersWithNames }

  instances.set(roomId, { state: namedState, visibility })

  // 将房间转为 started 并记录开始时间。
  const startedRoom: TRoomState = {
    ...room,
    stage: 'started',
    startAt: new Date().toISOString(),
  }
  rooms.setRoom(roomId, startedRoom)

  // 广播房间状态更新（不含游戏细节）+ 每个玩家的游戏视角。
  rooms.broadcastRoom(startedRoom)
  broadcastGame(roomId)
}

/**
 * 处理单个游戏事件：校验房间与实例存在，调用引擎 handleEvent，
 * 成功则更新权威状态并广播 gameUpdated；失败则向行动者单播 serverError。
 */
export function handleGameEvent(
  roomId: string,
  actorId: string,
  event: TAvalonEvent,
): TAvalonEventResult | { error: 'errorNoGame' | 'errorNotInRoom' | 'errorNoEngine' } {
  const instance = instances.get(roomId)
  if (!instance) {
    return { error: 'errorNoGame' }
  }
  const room = rooms.getRoom(roomId)
  if (!room) {
    return { error: 'errorNoGame' }
  }
  if (!room.players.some(p => p.id === actorId)) {
    return { error: 'errorNotInRoom' }
  }

  const engine = getGameEngine(room.gameType)
  if (!engine) {
    return { error: 'errorNoEngine' }
  }

  const result: TAvalonEventResult = engine.handleEvent(instance.state, event, actorId)
  if ('error' in result) {
    return result
  }

  // 保持玩家名称/忠诚度（引擎返回的新状态会保留原始 players 对象，此处做防御性合并）。
  const mergedPlayers = result.state.players.map((p) => {
    const prev = instance.state.players.find(x => x.id === p.id)
    return {
      ...p,
      name: p.name ?? prev?.name,
      loyalty: p.loyalty ?? prev?.loyalty,
    }
  })
  const mergedState: AvalonGameState = { ...result.state, players: mergedPlayers }
  instance.state = mergedState

  broadcastGame(roomId)

  return { state: mergedState }
}

/**
 * 更新房间的游戏配置（角色开关等）。仅房主可在 created/locked 阶段调用。
 */
export function updateGameOptions(
  roomId: string,
  requesterId: string,
  config: TGameConfig,
): RoomError | undefined {
  const room = rooms.getRoom(roomId)
  if (!room) {
    return { error: 'errorNotFound' }
  }
  if (room.leaderID !== requesterId) {
    return { error: 'errorNotLeader' }
  }
  if (room.stage === 'started') {
    return { error: 'errorGameAlreadyStarted' }
  }

  const updated: TRoomState = { ...room, config }
  rooms.setRoom(roomId, updated)
  rooms.broadcastRoom(updated)
}
