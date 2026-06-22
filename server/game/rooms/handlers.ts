import type { Server as IOServer, Socket } from 'socket.io'
import * as rooms from '../rooms'
import type { TRoomState } from '../../../shared/types/common/room'
import type { TRoomsList } from '../../../shared/types/common/room-list'
import type { RoomError } from '../../../shared/types/api/errors'

type ServerSocket = Socket<any, any, any, any>

/** Return the userId stashed in socket.data by the auth middleware, or null. */
function requireUserId(socket: ServerSocket): string | null {
  const uid = (socket.data as { userId?: string } | undefined)?.userId
  if (!uid) {
    socket.emit('serverError', 'unauthorized')
    return null
  }
  return uid
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
}
