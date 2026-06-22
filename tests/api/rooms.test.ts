import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mockEvent } from 'h3'

const fakeIo = {
  to: vi.fn().mockReturnThis(),
  emit: vi.fn(),
}

vi.mock('../../server/utils/socket', () => ({
  getIO: () => fakeIo,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  fakeIo.to.mockReturnThis()
  fakeIo.emit.mockReset()
})

// Re-import the handlers and the service per test so module-level Maps reset.
const loadHandlers = async () => {
  const listHandler = (await import('../../server/api/rooms/index.get')).default
  const detailHandler = (await import('../../server/api/rooms/[id].get')).default
  return { listHandler, detailHandler }
}

const loadService = () => import('../../server/game/rooms')

describe('GET /api/rooms（列表）', () => {
  it('未认证返回 401', async () => {
    const { listHandler } = await loadHandlers()

    try {
      await listHandler(mockEvent('http://localhost/api/rooms') as any)
      expect.fail('expected handler to throw')
    }
    catch (err: any) {
      expect(err.status).toBe(401)
    }
  })

  it('认证通过返回 TRoomsList（空房间时为空数组）', async () => {
    const { signJWT } = await import('../../server/utils/auth')
    const { listHandler } = await loadHandlers()

    const token = signJWT({ userId: 'u1' })
    const result = await listHandler(
      mockEvent('http://localhost/api/rooms', { headers: { authorization: `Bearer ${token}` } }) as any,
    )

    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([])
  })

  it('认证通过且有房间时返回所有房间的摘要', async () => {
    const { signJWT } = await import('../../server/utils/auth')
    const { createRoom } = await loadService()
    const { listHandler } = await loadHandlers()

    await createRoom('u1')
    await createRoom('u2')
    const token = signJWT({ userId: 'u1' })

    const result = await listHandler(
      mockEvent('http://localhost/api/rooms', { headers: { authorization: `Bearer ${token}` } }) as any,
    ) as any[]

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      gameType: 'avalon',
      state: 'created',
      players: 1,
    })
  })
})

describe('GET /api/rooms/[id]（详情）', () => {
  it('未认证返回 401', async () => {
    const { detailHandler } = await loadHandlers()
    const event = mockEvent('http://localhost/api/rooms/x') as any
    event.context.params = { id: 'x' }

    try {
      await detailHandler(event)
      expect.fail('expected handler to throw')
    }
    catch (err: any) {
      expect(err.status).toBe(401)
    }
  })

  it('房间不存在返回 404', async () => {
    const { signJWT } = await import('../../server/utils/auth')
    const { detailHandler } = await loadHandlers()
    const token = signJWT({ userId: 'u1' })

    const event = mockEvent('http://localhost/api/rooms/nope', {
      headers: { authorization: `Bearer ${token}` },
    }) as any
    event.context.params = { id: 'nope' }

    try {
      await detailHandler(event)
      expect.fail('expected handler to throw')
    }
    catch (err: any) {
      expect(err.status).toBe(404)
    }
  })

  it('认证通过返回完整 TRoomState', async () => {
    const { signJWT } = await import('../../server/utils/auth')
    const { createRoom, getRoom } = await loadService()
    const { detailHandler } = await loadHandlers()

    const uuid = await createRoom('u1')
    const token = signJWT({ userId: 'u1' })

    const event = mockEvent(`http://localhost/api/rooms/${uuid}`, {
      headers: { authorization: `Bearer ${token}` },
    }) as any
    event.context.params = { id: uuid }

    const result = await detailHandler(event)

    expect(result).toEqual(getRoom(uuid))
  })
})
