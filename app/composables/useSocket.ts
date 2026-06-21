import { io, type Socket } from 'socket.io-client'
import { socketURL, userProfilePath } from '~/utils/const'

type SocketCallback = (data: any) => void

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, SocketCallback[]> = new Map()

  private getAuthToken(): string | undefined {
    if (typeof window === 'undefined') return undefined
    try {
      const raw = localStorage.getItem(userProfilePath)
      if (raw) {
        const profile = JSON.parse(raw)
        return profile?.token
      }
    }
    catch {
      // ignore
    }
    return undefined
  }

  connect() {
    if (this.socket?.connected) return this

    this.socket = io(socketURL, {
      path: '/socket.io/',
      auth: {
        token: this.getAuthToken(),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.emitInternal('connect')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
      this.emitInternal('disconnect')
    })

    this.socket.onAny((event, ...args) => {
      const callbacks = this.listeners.get(event) || []
      callbacks.forEach(cb => cb(args.length === 1 ? args[0] : args))
    })

    return this
  }

  private emitInternal(event: string, data?: any) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => cb(data))
  }

  emit(event: string, ...args: any[]) {
    if (event === 'connect' || event === 'disconnect') {
      this.emitInternal(event, args[0])
      return
    }
    this.socket?.emit(event, ...args)
  }

  emitWithAck<T = any>(event: string, ...args: any[]): Promise<T> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve(null as any)
        return
      }
      const timer = setTimeout(() => {
        resolve(null as any)
      }, 30000)

      this.socket.emit(event, ...args, (response: T) => {
        clearTimeout(timer)
        resolve(response)
      })
    })
  }

  on(event: string, callback: SocketCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback?: SocketCallback) {
    if (!callback) {
      this.listeners.delete(event)
      return
    }
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    return this
  }

  updateAuthToken() {
    if (this.socket) {
      this.socket.auth = { token: this.getAuthToken() }
      this.socket.disconnect()
      setTimeout(() => {
        this.socket?.connect()
      }, 100)
    }
  }
}

export const socket = new SocketService()
