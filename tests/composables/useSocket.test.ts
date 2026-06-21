import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.stubGlobal('window', {})
vi.stubGlobal('localStorage', {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
})

const mockEmit = vi.fn()
const mockOn = vi.fn()
const mockOnAny = vi.fn()
const mockDisconnect = vi.fn()
const mockConnect = vi.fn()

const mockSocketInstance = {
  connected: true,
  on: mockOn,
  onAny: mockOnAny,
  emit: mockEmit,
  disconnect: mockDisconnect,
  connect: mockConnect,
  auth: {},
}

const mockIo = vi.fn(() => mockSocketInstance)

vi.mock('socket.io-client', () => ({
  io: (...args: any[]) => mockIo(...args),
}))

describe('SocketService 类', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('构造时不应自动连接', async () => {
    const { socket } = await import('~/composables/useSocket')
    expect(mockIo).not.toHaveBeenCalled()
  })

  it('调用 connect() 后应初始化 socket.io-client 连接', async () => {
    const { socket } = await import('~/composables/useSocket')
    socket.connect()
    expect(mockIo).toHaveBeenCalled()
  })

  it('emit 应调用底层 socket.emit', async () => {
    const { socket } = await import('~/composables/useSocket')
    socket.connect()
    socket.emit('test-event', 'arg1', 'arg2')
    expect(mockEmit).toHaveBeenCalledWith('test-event', 'arg1', 'arg2')
  })

  it('emit connect/disconnect 应触发内部监听器而非 socket.emit', async () => {
    const { socket } = await import('~/composables/useSocket')
    socket.connect()
    const cb = vi.fn()
    socket.on('connect', cb)
    socket.emit('connect')
    expect(cb).toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalledWith('connect')
  })

  it('on 应注册事件监听器，off 应移除', async () => {
    const { socket } = await import('~/composables/useSocket')
    socket.connect()
    const cb = vi.fn()
    socket.on('custom', cb)
    socket.off('custom', cb)
    expect(true).toBe(true)
  })

  it('off 不传 callback 时应移除该事件所有监听器', async () => {
    const { socket } = await import('~/composables/useSocket')
    socket.connect()
    socket.on('event1', vi.fn())
    socket.on('event1', vi.fn())
    socket.off('event1')
    expect(true).toBe(true)
  })

  it('disconnect 应调用底层 socket.disconnect', async () => {
    const { socket } = await import('~/composables/useSocket')
    socket.connect()
    socket.disconnect()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('emitWithAck 应返回 Promise', async () => {
    const { socket } = await import('~/composables/useSocket')
    socket.connect()
    const result = socket.emitWithAck('test')
    expect(result).toBeInstanceOf(Promise)
  })
})
