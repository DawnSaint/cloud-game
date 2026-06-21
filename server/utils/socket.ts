import { Server } from 'socket.io'

let io: Server | null = null

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

export function setIO(instance: Server) {
  io = instance
}
