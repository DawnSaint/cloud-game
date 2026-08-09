import { randomUUID } from 'node:crypto'
import { getIO } from '../utils/socket'
import type {
  TRoomState,
  TRoomInfo,
  TGameConfig,
} from '../../shared/types/common/room'
import type { RoomError } from '../../shared/types/api/errors'

const LOBBY_CHANNEL = 'lobby'

/** Active rooms indexed by uuid. Source of truth for room state. */
const rooms: Map<string, TRoomState> = new Map()

/** Reverse index: which room each socket is in. Used to clean up on disconnect. */
const socketRoom: Map<string, string> = new Map()

/** Build the lobby list item from full room state. */
function toRoomInfo(state: TRoomState): TRoomInfo {
  const info: TRoomInfo = {
    uuid: state.roomID,
    gameType: state.gameType,
    hostID: state.leaderID,
    players: state.players.length,
    state: state.stage,
    config: state.config,
    createAt: state.createAt,
  }
  if (state.stage === 'started') {
    info.startAt = state.startAt
    if ('game' in state && state.game?.result) {
      info.result = state.game.result
    }
  }
  return info
}

/** Broadcast full state to room + fresh list to lobby. */
export function broadcastRoom(state: TRoomState): void {
  const io = getIO()
  io.to(state.roomID).emit('roomUpdated', state)
  io.to(LOBBY_CHANNEL).emit('roomsListUpdated', listRooms())
}

/** Broadcast only the lobby list (used on room destroy where no roomUpdated fires). */
function broadcastLobbyOnly(): void {
  getIO().to(LOBBY_CHANNEL).emit('roomsListUpdated', listRooms())
}

export function listRooms(): TRoomInfo[] {
  return [...rooms.values()].map(toRoomInfo)
}

export function getRoom(uuid: string): TRoomState | undefined {
  return rooms.get(uuid)
}

/** 替换房间状态（用于游戏配置更新、游戏启动等需要整体替换的场景）。 */
export function setRoom(uuid: string, state: TRoomState): void {
  rooms.set(uuid, state)
}

/** 遍历所有房间（用于断线重连时查找玩家所在房间）。 */
export function allRooms(): Map<string, TRoomState> {
  return rooms
}

/**
 * Create a room with the given creator as leader and first player.
 * gameType is hardcoded to 'avalon' (single-game era; will be widened when a
 * second game lands and the createRoom event signature is updated).
 */
export async function createRoom(creatorId: string): Promise<string> {
  const uuid = randomUUID()
  const state: TRoomState = {
    stage: 'created',
    gameType: 'avalon',
    roomID: uuid,
    leaderID: creatorId,
    createAt: new Date().toISOString(),
    players: [{ id: creatorId, isLeader: true }],
    config: { roles: {} } as TGameConfig,
  }
  rooms.set(uuid, state)
  broadcastRoom(state)
  return uuid
}

/** Add a player to a room. */
export async function joinRoom(
  roomId: string,
  playerId: string,
): Promise<TRoomState | RoomError> {
  const state = rooms.get(roomId)
  if (!state) {
    return { error: 'errorNotFound' }
  }
  if (state.stage === 'locked') {
    return { error: 'errorLocked' }
  }
  if (state.players.some(p => p.id === playerId)) {
    return { error: 'errorAlreadyInRoom' }
  }
  state.players.push({ id: playerId, isLeader: false })
  broadcastRoom(state)
  return state
}

/** Remove a player; transfer leadership or destroy empty room. */
export async function leaveRoom(
  roomId: string,
  playerId: string,
): Promise<RoomError | undefined> {
  const state = rooms.get(roomId)
  if (!state) {
    return { error: 'errorNotFound' }
  }
  const idx = state.players.findIndex(p => p.id === playerId)
  if (idx === -1) {
    return { error: 'errorNotInRoom' }
  }

  state.players.splice(idx, 1)

  if (state.players.length === 0) {
    rooms.delete(roomId)
    getIO().to(roomId).emit('destroyRoom', roomId)
    broadcastLobbyOnly()
    return
  }

  if (state.leaderID === playerId) {
    const newLeader = state.players[0]
    state.leaderID = newLeader.id
    for (const p of state.players) {
      p.isLeader = p.id === newLeader.id
    }
  }

  broadcastRoom(state)
}

/** Toggle the room lock. Only the current leader may call this. */
export async function lockRoom(
  roomId: string,
  requesterId: string,
): Promise<TRoomState | RoomError> {
  const state = rooms.get(roomId)
  if (!state) {
    return { error: 'errorNotFound' }
  }
  if (state.leaderID !== requesterId) {
    return { error: 'errorNotLeader' }
  }
  const nextStage = state.stage === 'locked' ? 'created' : 'locked'
  const next: TRoomState = { ...state, stage: nextStage } as TRoomState
  rooms.set(roomId, next)
  broadcastRoom(next)
  return next
}

/** Remove a target player. Only the current leader may call this. */
export async function kickPlayer(
  roomId: string,
  requesterId: string,
  targetId: string,
): Promise<RoomError | undefined> {
  const state = rooms.get(roomId)
  if (!state) {
    return { error: 'errorNotFound' }
  }
  if (state.leaderID !== requesterId || requesterId === targetId) {
    return { error: 'errorNotLeader' }
  }
  const idx = state.players.findIndex(p => p.id === targetId)
  if (idx === -1) {
    return { error: 'errorNotInRoom' }
  }
  state.players.splice(idx, 1)
  broadcastRoom(state)
  broadcastLobbyOnly()
}

export function trackSocketInRoom(socketId: string, roomId: string): void {
  socketRoom.set(socketId, roomId)
}

export function clearSocketFromRoom(socketId: string): void {
  socketRoom.delete(socketId)
}

export function getSocketRoomId(socketId: string): string | undefined {
  return socketRoom.get(socketId)
}
