import { definePlugin } from 'nitro'
import { createServer, type Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { setIO } from '../utils/socket'
import { verifyJWT } from '../utils/auth'
import * as userService from '../db/user'
import * as rooms from '../game/rooms'
import * as instances from '../game/instances'
import { registerRoomHandlers } from '../game/rooms/handlers'

const SOCKET_PORT = Number(process.env.SOCKET_PORT) || 3200

/** 查找玩家当前所在的房间 id（遍历房间列表匹配玩家 id）。 */
function findRoomIdForUser(userId: string): string | undefined {
  for (const [uuid, state] of rooms.allRooms()) {
    if (state.players.some(p => p.id === userId)) {
      return uuid
    }
  }
  return undefined
}

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
    const { token } = socket.handshake.auth
    let userId: string | undefined

    if (token) {
      const payload = verifyJWT(token)
      if (payload) {
        userId = payload.userId
        socket.join(userId)
        socket.data.userId = userId
        socket.join('lobby')
      }
      else {
        socket.emit('renewJWT')
      }
    }

    console.log(`[Socket.IO] connected: ${socket.id}${userId ? ` (user: ${userId})` : ''}`)

    socket.on('registerUser', async (user, cb) => {
      const result = await userService.registerUser(user)
      cb(result)
    })

    socket.on('login', async (loginOrEmail, password, cb) => {
      const result = await userService.login(loginOrEmail, password)
      cb(result)
    })

    socket.on('getUserProfile', async (id, cb) => {
      const profile = await userService.getPublicUserProfile(id)
      if (profile) {
        cb(profile)
      }
    })

    // 断线重连：若玩家所在房间正在进行游戏，重新推送当前游戏状态。
    if (userId) {
      const roomId = findRoomIdForUser(userId)
      if (roomId) {
        // 重连时自动重新加入房间频道，确保后续广播可达。
        void socket.join(roomId)
        rooms.trackSocketInRoom(socket.id, roomId)
        // 推送房间状态 + 游戏状态（若游戏进行中）。
        const room = rooms.getRoom(roomId)
        if (room) {
          socket.emit('roomUpdated', room)
          instances.broadcastGameTo(roomId, userId)
        }
      }
    }

    if (userId) {
      socket.on('getMyProfile', async (cb) => {
        const profile = await userService.getUserProfile(userId!)
        if (profile) {
          cb(profile)
        }
      })

      socket.on('updateUserName', (name) => {
        userService.updateUserName(userId!, name)
      })

      socket.on('updateUserEmail', async (password, email, cb) => {
        const result = await userService.updateCredentials(userId!, password, 'email', email)
        cb(result)
      })

      socket.on('updateUserLogin', async (password, login, cb) => {
        const result = await userService.updateCredentials(userId!, password, 'login', login)
        cb(result)
      })

      socket.on('updateUserPassword', async (password, newPassword, cb) => {
        const result = await userService.updateCredentials(userId!, password, 'password', newPassword)
        cb(result)
      })

      registerRoomHandlers(io, socket)
    }

    socket.on('disconnect', async () => {
      console.log('[Socket.IO] disconnected:', socket.id)
      const roomId = rooms.getSocketRoomId(socket.id)
      if (userId && roomId) {
        try {
          await rooms.leaveRoom(roomId, userId)
        }
        catch (err) {
          console.error('[Socket.IO] force leaveRoom failed:', err)
        }
        rooms.clearSocketFromRoom(socket.id)
      }
    })
  })

  httpServer.listen(SOCKET_PORT, () => {
    console.log(`[Socket.IO] listening on port ${SOCKET_PORT}`)
  })
})
