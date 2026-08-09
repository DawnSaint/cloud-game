import type { Server as IOServer, Socket } from 'socket.io'
import type {
  TRoomState,
  TVoteOption,
  TMissionResult,
} from '../../../shared/types'
import type { RoomError } from '../../../shared/types/api/errors'
import * as rooms from '../rooms'
import * as instances from '../instances'
import type { TRoomsList } from '../../../shared/types/common/room-list'

type ServerSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, Record<string, never>>

/** Return the userId stashed in socket.data by the auth middleware, or null. */
function requireUserId(socket: ServerSocket): string | null {
  const uid = (socket.data as { userId?: string } | undefined)?.userId
  if (!uid) {
    socket.emit('serverError', 'unauthorized')
    return null
  }
  return uid
}

/** Emit an error string to a single socket (used for per-player validation failures). */
function emitError(socket: ServerSocket, error: string): void {
  socket.emit('serverError', error)
}

export function registerRoomHandlers(_io: IOServer, socket: ServerSocket): void {
  socket.on('createRoom', async (cb: (uuid: string) => void) => {
    const uid = requireUserId(socket)
    if (!uid) return
    try {
      const uuid = await rooms.createRoom(uid)
      cb(uuid)
    }
    catch (err) {
      socket.emit('serverError', String(err))
    }
  })

  socket.on('joinRoom', async (uuid: string, cb: (s: TRoomState | RoomError) => void) => {
    const uid = requireUserId(socket)
    if (!uid) return
    try {
      const result = await rooms.joinRoom(uuid, uid)
      if ('error' in result) {
        cb(result)
        return
      }
      void socket.join(uuid)
      rooms.trackSocketInRoom(socket.id, uuid)
      cb(result)
    }
    catch (err) {
      socket.emit('serverError', String(err))
    }
  })

  socket.on('leaveRoom', async (uuid: string) => {
    const uid = requireUserId(socket)
    if (!uid) return
    try {
      await rooms.leaveRoom(uuid, uid)
    }
    finally {
      void socket.leave(uuid)
      rooms.clearSocketFromRoom(socket.id)
    }
  })

  socket.on('lockRoom', async (uuid: string) => {
    const uid = requireUserId(socket)
    if (!uid) return
    try {
      await rooms.lockRoom(uuid, uid)
    }
    catch (err) {
      socket.emit('serverError', String(err))
    }
  })

  socket.on('kickPlayer', async (uuid: string, targetId: string) => {
    const uid = requireUserId(socket)
    if (!uid) return
    try {
      await rooms.kickPlayer(uuid, uid, targetId)
    }
    catch (err) {
      socket.emit('serverError', String(err))
    }
  })

  socket.on('getRoomsList', (cb: (list: TRoomsList) => void) => {
    cb(rooms.listRooms())
  })

  // ==================== 游戏事件 ====================

  socket.on('startGame', async (uuid: string) => {
    const uid = requireUserId(socket)
    if (!uid) return
    const result = await instances.startGame(uuid, uid)
    if (result && 'error' in result) {
      emitError(socket, result.error)
    }
  })

  socket.on('updateOptions', (uuid: string, config: TRoomState['config']) => {
    const uid = requireUserId(socket)
    if (!uid) return
    const result = instances.updateGameOptions(uuid, uid, config)
    if (result && 'error' in result) {
      emitError(socket, result.error)
    }
  })

  socket.on('selectPlayer', (uuid: string, playerId: string) => {
    const uid = requireUserId(socket)
    if (!uid) return
    const result = instances.handleGameEvent(uuid, uid, { type: 'selectPlayer', playerId })
    if ('error' in result) {
      emitError(socket, result.error)
    }
  })

  socket.on('sentSelectedPlayers', (uuid: string) => {
    const uid = requireUserId(socket)
    if (!uid) return
    const result = instances.handleGameEvent(uuid, uid, { type: 'submitTeam' })
    if ('error' in result) {
      emitError(socket, result.error)
    }
  })

  socket.on('voteForMission', (uuid: string, option: TVoteOption) => {
    const uid = requireUserId(socket)
    if (!uid) return
    const result = instances.handleGameEvent(uuid, uid, { type: 'castVote', option })
    if ('error' in result) {
      emitError(socket, result.error)
    }
  })

  socket.on('actionOnMission', (uuid: string, result: TMissionResult) => {
    const uid = requireUserId(socket)
    if (!uid) return
    const outcome = instances.handleGameEvent(uuid, uid, { type: 'missionAction', result })
    if ('error' in outcome) {
      emitError(socket, outcome.error)
    }
  })

  socket.on('assassinate', (uuid: string, targetId: string) => {
    const uid = requireUserId(socket)
    if (!uid) return
    const result = instances.handleGameEvent(uuid, uid, { type: 'assassinate', targetId })
    if ('error' in result) {
      emitError(socket, result.error)
    }
  })
}
