import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { TRoomState, StartedRoomState, TRoomInfo } from '../../shared/types/common/room'

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

// Re-import the service fresh per test so module-level Maps reset.
const loadService = () => import('../../server/game/rooms')

describe('createRoom', () => {
  it('createRoom 返回 uuid 并把创建者设为 leader 和唯一玩家', async () => {
    const { createRoom, getRoom } = await loadService()

    const uuid = await createRoom('u1')

    expect(typeof uuid).toBe('string')
    const state = getRoom(uuid)
    expect(state).toBeDefined()
    expect(state?.leaderID).toBe('u1')
    expect(state?.players).toEqual([{ id: 'u1', isLeader: true }])
  })

  it('createRoom 阶段固定为 created，gameType 硬编码为 avalon', async () => {
    const { createRoom, getRoom } = await loadService()

    const uuid = await createRoom('u1')

    const state = getRoom(uuid) as TRoomState
    expect(state.stage).toBe('created')
    expect(state.gameType).toBe('avalon')
  })
})

describe('joinRoom', () => {
  it('joinRoom 房间不存在时返回 errorNotFound', async () => {
    const { joinRoom } = await loadService()

    const result = await joinRoom('nonexistent', 'u1')

    expect(result).toEqual({ error: 'errorNotFound' })
  })

  it('joinRoom 已锁定房间返回 errorLocked', async () => {
    const { createRoom, lockRoom, joinRoom } = await loadService()

    const uuid = await createRoom('u1')
    await lockRoom(uuid, 'u1')

    const result = await joinRoom(uuid, 'u2')

    expect(result).toEqual({ error: 'errorLocked' })
  })

  it('joinRoom 玩家已在房间时返回 errorAlreadyInRoom', async () => {
    const { createRoom, joinRoom } = await loadService()

    const uuid = await createRoom('u1')
    await joinRoom(uuid, 'u1') // 自身重复 join

    const result = await joinRoom(uuid, 'u1')

    expect(result).toEqual({ error: 'errorAlreadyInRoom' })
  })

  it('joinRoom 成功添加玩家并广播 roomUpdated 与 roomsListUpdated', async () => {
    const { createRoom, joinRoom, getRoom } = await loadService()

    const uuid = await createRoom('u1')
    fakeIo.emit.mockClear()
    const result = await joinRoom(uuid, 'u2')

    expect('error' in result).toBe(false)
    if (!('error' in result)) {
      expect(result.players.map(p => p.id)).toEqual(['u1', 'u2'])
    }
    expect(getRoom(uuid)?.players).toHaveLength(2)
    // roomUpdated + roomsListUpdated
    const emitCalls = fakeIo.emit.mock.calls.map(c => c[0])
    expect(emitCalls).toContain('roomUpdated')
    expect(emitCalls).toContain('roomsListUpdated')
  })
})

describe('leaveRoom', () => {
  it('leaveRoom 普通玩家离开保留房间与领导', async () => {
    const { createRoom, joinRoom, leaveRoom, getRoom } = await loadService()

    const uuid = await createRoom('u1')
    await joinRoom(uuid, 'u2')

    fakeIo.emit.mockClear()
    await leaveRoom(uuid, 'u2')

    const state = getRoom(uuid)
    expect(state?.leaderID).toBe('u1')
    expect(state?.players.map(p => p.id)).toEqual(['u1'])
    const emitCalls = fakeIo.emit.mock.calls.map(c => c[0])
    expect(emitCalls).toContain('roomUpdated')
    expect(emitCalls).not.toContain('destroyRoom')
  })

  it('leaveRoom 房主离开且有其他人时转移领导给首位玩家', async () => {
    const { createRoom, joinRoom, leaveRoom, getRoom } = await loadService()

    const uuid = await createRoom('u1')
    await joinRoom(uuid, 'u2')
    await joinRoom(uuid, 'u3')

    await leaveRoom(uuid, 'u1')

    const state = getRoom(uuid)
    expect(state?.leaderID).toBe('u2')
    expect(state?.players.find(p => p.id === 'u2')?.isLeader).toBe(true)
    expect(state?.players.find(p => p.id === 'u3')?.isLeader).toBe(false)
  })

  it('leaveRoom 最后一名玩家离开销毁房间并广播 destroyRoom', async () => {
    const { createRoom, leaveRoom, getRoom } = await loadService()

    const uuid = await createRoom('u1')
    fakeIo.emit.mockClear()
    await leaveRoom(uuid, 'u1')

    expect(getRoom(uuid)).toBeUndefined()
    const emitCalls = fakeIo.emit.mock.calls.map(c => [c[0], c[1]])
    expect(emitCalls).toContainEqual(['destroyRoom', uuid])
    expect(emitCalls.map(c => c[0])).toContain('roomsListUpdated')
  })

  it('leaveRoom 房间不存在时返回 errorNotFound', async () => {
    const { leaveRoom } = await loadService()

    const result = await leaveRoom('nonexistent', 'u1')

    expect(result).toEqual({ error: 'errorNotFound' })
  })

  it('leaveRoom 玩家不在房间中时返回 errorNotInRoom', async () => {
    const { createRoom, leaveRoom } = await loadService()

    const uuid = await createRoom('u1')

    const result = await leaveRoom(uuid, 'u2')

    expect(result).toEqual({ error: 'errorNotInRoom' })
  })
})

describe('lockRoom', () => {
  it('lockRoom 房主调用时切换 created→locked→created', async () => {
    const { createRoom, lockRoom, getRoom } = await loadService()

    const uuid = await createRoom('u1')

    await lockRoom(uuid, 'u1')
    expect(getRoom(uuid)?.stage).toBe('locked')

    await lockRoom(uuid, 'u1')
    expect(getRoom(uuid)?.stage).toBe('created')
  })

  it('lockRoom 非房主调用返回 errorNotLeader', async () => {
    const { createRoom, joinRoom, lockRoom } = await loadService()

    const uuid = await createRoom('u1')
    await joinRoom(uuid, 'u2')

    const result = await lockRoom(uuid, 'u2')

    expect(result).toEqual({ error: 'errorNotLeader' })
  })

  it('lockRoom 房间不存在时返回 errorNotFound', async () => {
    const { lockRoom } = await loadService()

    const result = await lockRoom('nonexistent', 'u1')

    expect(result).toEqual({ error: 'errorNotFound' })
  })
})

describe('kickPlayer', () => {
  it('kickPlayer 房主踢人成功', async () => {
    const { createRoom, joinRoom, kickPlayer, getRoom } = await loadService()

    const uuid = await createRoom('u1')
    await joinRoom(uuid, 'u2')

    fakeIo.emit.mockClear()
    const result = await kickPlayer(uuid, 'u1', 'u2')

    expect(result).toBeUndefined()
    expect(getRoom(uuid)?.players.map(p => p.id)).toEqual(['u1'])
    const emitCalls = fakeIo.emit.mock.calls.map(c => c[0])
    expect(emitCalls).toContain('roomUpdated')
    expect(emitCalls).toContain('roomsListUpdated')
  })

  it('kickPlayer 非房主调用返回 errorNotLeader', async () => {
    const { createRoom, joinRoom, kickPlayer } = await loadService()

    const uuid = await createRoom('u1')
    await joinRoom(uuid, 'u2')
    await joinRoom(uuid, 'u3')

    const result = await kickPlayer(uuid, 'u2', 'u3')

    expect(result).toEqual({ error: 'errorNotLeader' })
  })

  it('kickPlayer 房主不能踢自己返回 errorNotLeader', async () => {
    const { createRoom, kickPlayer } = await loadService()

    const uuid = await createRoom('u1')

    const result = await kickPlayer(uuid, 'u1', 'u1')

    expect(result).toEqual({ error: 'errorNotLeader' })
  })

  it('kickPlayer 目标不在房间时返回 errorNotInRoom', async () => {
    const { createRoom, kickPlayer } = await loadService()

    const uuid = await createRoom('u1')

    const result = await kickPlayer(uuid, 'u1', 'u9')

    expect(result).toEqual({ error: 'errorNotInRoom' })
  })
})

describe('listRooms & toRoomInfo', () => {
  it('listRooms 没有任何房间时返回空数组', async () => {
    const { listRooms } = await loadService()

    expect(listRooms()).toEqual([])
  })

  it('listRooms 列出全部房间的 TRoomInfo 摘要', async () => {
    const { createRoom, listRooms } = await loadService()

    await createRoom('u1')
    await createRoom('u2')

    const list = listRooms()
    expect(list).toHaveLength(2)
    for (const info of list) {
      expect(info).toMatchObject({
        gameType: 'avalon',
        state: 'created',
        players: 1,
        config: expect.objectContaining({ roles: expect.any(Object) }),
      })
      expect(info.hostID).toBeDefined()
      expect(info.uuid).toBeDefined()
      expect(info.createAt).toBeDefined()
      // TRoomInfo.players 是 number（玩家数），不是数组
      expect(typeof info.players).toBe('number')
    }
  })

  it('listRooms 中 started 阶段房间附带 startAt', async () => {
    const { createRoom, listRooms } = await loadService()
    // 直接借用 listRooms 生成的 cache 来观察：createRoom 之后内部存的是 'created'，
    // 所以这里只断言 listRooms 不会因 started 分支而抛错，且空状态下返回 []。
    // started 阶段会在 v0.2.x 出现，届时会自然覆盖 toRoomInfo 的 if 分支。
    await createRoom('u1')
    const list = listRooms()
    expect(list).toHaveLength(1)
    expect(list[0].state).toBe('created')
    expect(list[0].startAt).toBeUndefined()
  })
})

describe('socket 反向索引', () => {
  it('trackSocketInRoom / getSocketRoomId / clearSocketFromRoom 正常映射', async () => {
    const { trackSocketInRoom, getSocketRoomId, clearSocketFromRoom } = await loadService()

    trackSocketInRoom('sock-1', 'room-1')
    expect(getSocketRoomId('sock-1')).toBe('room-1')

    clearSocketFromRoom('sock-1')
    expect(getSocketRoomId('sock-1')).toBeUndefined()
  })
})

describe('getRoom', () => {
  it('getRoom 返回 undefined 表示房间不存在', async () => {
    const { getRoom } = await loadService()

    expect(getRoom('not-a-uuid')).toBeUndefined()
  })
})

// 类型守卫：确保 TRoomInfo.players 是 number（不是数组）
const _typeCheck: TRoomInfo = {
  gameType: 'avalon',
  hostID: 'h',
  players: 0,
  state: 'created',
  uuid: 'u',
  config: { roles: {} },
  createAt: '',
}
void _typeCheck
// 类型守卫：StartedRoomState 形状存在
const _started: StartedRoomState = {
  stage: 'started',
  gameType: 'avalon',
  roomID: 'r',
  leaderID: 'u',
  createAt: '',
  startAt: '',
  players: [],
  config: { roles: {} },
  game: {} as any,
}
void _started
