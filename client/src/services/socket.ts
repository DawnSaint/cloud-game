import { io, Socket } from 'socket.io-client'
import type { Room, GameState } from '../types'

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect(url: string = 'http://localhost:3000') {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    this.socket.on('connect', () => {
      console.log('Socket 连接成功:', this.socket?.id)
    })

    this.socket.on('disconnect', () => {
      console.log('Socket 断开连接')
    })

    this.socket.on('error', (error: any) => {
      console.error('Socket 错误:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // 加入房间
  joinRoom(roomId: string, userId: string, username: string) {
    this.socket?.emit('join_room', { roomId, userId, username })
  }

  // 离开房间
  leaveRoom(roomId: string, userId: string) {
    this.socket?.emit('leave_room', { roomId, userId })
  }

  // 切换准备状态
  toggleReady(roomId: string, userId: string) {
    this.socket?.emit('toggle_ready', { roomId, userId })
  }

  // 开始游戏
  startGame(roomId: string, userId: string) {
    this.socket?.emit('start_game', { roomId, userId })
  }

  // 提议组队
  proposeTeam(roomId: string, userId: string, teamUserIds: string[]) {
    this.socket?.emit('propose_team', { roomId, userId, teamUserIds })
  }

  // 投票队伍
  voteTeam(roomId: string, userId: string, approve: boolean) {
    this.socket?.emit('vote_team', { roomId, userId, approve })
  }

  // 任务投票
  voteMission(roomId: string, userId: string, success: boolean) {
    this.socket?.emit('vote_mission', { roomId, userId, success })
  }

  // 刺杀
  assassinate(roomId: string, userId: string, targetUserId: string) {
    this.socket?.emit('assassinate', { roomId, userId, targetUserId })
  }

  // 获取游戏状态
  getGameState(roomId: string, userId: string) {
    this.socket?.emit('get_game_state', { roomId, userId })
  }

  // 监听事件
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
    this.socket?.on(event, callback as any)
  }

  // 移除监听
  off(event: string, callback?: Function) {
    if (callback) {
      this.socket?.off(event, callback as any)
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    } else {
      this.socket?.off(event)
      this.listeners.delete(event)
    }
  }

  // 移除所有监听
  offAll() {
    this.listeners.forEach((callbacks, event) => {
      this.socket?.off(event)
    })
    this.listeners.clear()
  }
}

export default new SocketService()
