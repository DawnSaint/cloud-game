import { definePlugin } from 'nitro'
import { createServer, type Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { setIO } from '../utils/socket'
import { verifyJWT } from '../utils/auth'
import * as userService from '../db/user'

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
    const { token } = socket.handshake.auth
    let userId: string | undefined

    if (token) {
      const payload = verifyJWT(token)
      if (payload) {
        userId = payload.userId
        socket.join(userId)
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
    }

    socket.on('disconnect', () => {
      console.log('[Socket.IO] disconnected:', socket.id)
    })
  })

  httpServer.listen(SOCKET_PORT, () => {
    console.log(`[Socket.IO] listening on port ${SOCKET_PORT}`)
  })
})
