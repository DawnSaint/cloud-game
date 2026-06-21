import { definePlugin } from 'nitro'
import { createServer, type Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { setIO } from '../utils/socket'

const SOCKET_PORT = Number(process.env.SOCKET_PORT) || 3200

let httpServer: HttpServer | null = null

export default definePlugin(() => {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }

  httpServer = createServer()
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
    path: '/socket.io/',
  })

  setIO(io)

  io.on('connection', (socket) => {
    console.log('[Socket.IO] connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('[Socket.IO] disconnected:', socket.id)
    })
  })

  httpServer.listen(SOCKET_PORT, () => {
    console.log(`[Socket.IO] listening on port ${SOCKET_PORT}`)
  })
})
