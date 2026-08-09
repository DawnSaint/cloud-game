import { describe, expect, it, vi, beforeEach } from 'vitest'

const fakeIo = {
  to: vi.fn().mockReturnThis(),
  emit: vi.fn(),
}

vi.mock('../../server/utils/socket', () => ({
  getIO: () => fakeIo,
}))

vi.mock('../../server/db/user', () => ({
  getPublicUserProfile: vi.fn(async (id: string) => ({ id, name: `User-${id}`, avatar: 'servant' })),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  fakeIo.to.mockReturnThis()
  fakeIo.emit.mockReset()
})

// 每个用例重新导入模块以确保引擎注册与状态重置
const loadInstances = async () => {
  await import('../../server/game/avalon')
  return await import('../../server/game/instances')
}
const loadRooms = async () => {
  await import('../../server/game/avalon')
  return await import('../../server/game/rooms')
}

describe('startGame', () => {
  it('房间不存在时返回 errorNotFound', async () => {
    const { startGame } = await loadInstances()
    const result = await startGame('nonexistent', 'u1')
    expect(result).toEqual({ error: 'errorNotFound' })
  })

  it('非房主无法启动游戏', async () => {
    const { startGame } = await loadInstances()
    const { createRoom, getRoom } = await loadRooms()
    const uuid = await createRoom('leader')
    const result = await startGame(uuid, 'not-leader')
    expect(result).toEqual({ error: 'errorNotLeader' })
    // 房间状态不变
    expect(getRoom(uuid)?.stage).toBe('created')
  })

  it('人数不足时返回 errorPlayerCount', async () => {
    const { startGame } = await loadInstances()
    const { createRoom, joinRoom, getRoom } = await loadRooms()
    const uuid = await createRoom('leader')
    // 只有 2 人，不足 5 人
    await joinRoom(uuid, 'p2')
    const result = await startGame(uuid, 'leader')
    expect(result).toEqual({ error: 'errorPlayerCount' })
    expect(getRoom(uuid)?.stage).toBe('created')
  })

  it('房主启动游戏成功：房间转为 started，实例已创建', async () => {
    const { startGame, getInstance } = await loadInstances()
    const { createRoom, joinRoom, getRoom } = await loadRooms()
    const uuid = await createRoom('leader')
    for (let i = 2; i <= 5; i++) {
      await joinRoom(uuid, `p${i}`)
    }
    const result = await startGame(uuid, 'leader')
    expect(result).toBeUndefined()

    const room = getRoom(uuid)
    expect(room?.stage).toBe('started')
    expect(room?.startAt).toBeDefined()

    const instance = getInstance(uuid)
    expect(instance).toBeDefined()
    expect(instance?.state.stage).toBe('selectTeam')
    expect(instance?.state.players).toHaveLength(5)
    // 玩家名称已填充
    expect(instance?.state.players[0]?.name).toBeDefined()
  })

  it('已开始的游戏无法重复启动', async () => {
    const { startGame } = await loadInstances()
    const { createRoom, joinRoom } = await loadRooms()
    const uuid = await createRoom('leader')
    for (let i = 2; i <= 5; i++) {
      await joinRoom(uuid, `p${i}`)
    }
    await startGame(uuid, 'leader')
    const result = await startGame(uuid, 'leader')
    expect(result).toEqual({ error: 'errorGameAlreadyStarted' })
  })
})

describe('handleGameEvent', () => {
  async function setupGame(): Promise<string> {
    const { startGame } = await loadInstances()
    const { createRoom, joinRoom } = await loadRooms()
    const uuid = await createRoom('leader')
    for (let i = 2; i <= 5; i++) {
      await joinRoom(uuid, `p${i}`)
    }
    await startGame(uuid, 'leader')
    return uuid
  }

  it('无游戏实例时返回 errorNoGame', async () => {
    const { handleGameEvent } = await loadInstances()
    const result = await handleGameEvent('no-game', 'u1', { type: 'selectPlayer', playerId: 'u2' })
    expect(result).toEqual({ error: 'errorNoGame' })
  })

  it('房间内玩家可执行 selectPlayer', async () => {
    const uuid = await setupGame()
    const { handleGameEvent, getInstance } = await loadInstances()
    const instance = getInstance(uuid)!
    const leaderId = instance.state.leaderID
    const result = await handleGameEvent(uuid, leaderId, { type: 'selectPlayer', playerId: instance.state.players[1]!.id })
    expect('state' in result).toBe(true)
    if ('state' in result) {
      expect(result.state.currentTeam).toContain(instance.state.players[1]!.id)
    }
  })

  it('非房间成员无法执行事件', async () => {
    const uuid = await setupGame()
    const { handleGameEvent } = await loadInstances()
    const result = await handleGameEvent(uuid, 'intruder', { type: 'selectPlayer', playerId: 'leader' })
    expect(result).toEqual({ error: 'errorNotInRoom' })
  })

  it('无效事件返回引擎错误', async () => {
    const uuid = await setupGame()
    const { handleGameEvent, getInstance } = await loadInstances()
    const instance = getInstance(uuid)!
    // 非领袖尝试选择玩家
    const nonLeader = instance.state.players.find(p => p.id !== instance.state.leaderID)!
    const result = await handleGameEvent(uuid, nonLeader.id, { type: 'selectPlayer', playerId: instance.state.leaderID })
    expect('error' in result).toBe(true)
  })
})

describe('updateGameOptions', () => {
  it('非房主无法更新配置', async () => {
    const { updateGameOptions } = await loadInstances()
    const { createRoom, getRoom } = await loadRooms()
    const uuid = await createRoom('leader')
    const result = await updateGameOptions(uuid, 'not-leader', { roles: { merlin: 1 } })
    expect(result).toEqual({ error: 'errorNotLeader' })
    expect(getRoom(uuid)?.config.roles.merlin).toBeUndefined()
  })

  it('房主可更新角色配置', async () => {
    const { updateGameOptions } = await loadInstances()
    const { createRoom, getRoom } = await loadRooms()
    const uuid = await createRoom('leader')
    const result = await updateGameOptions(uuid, 'leader', { roles: { merlin: 1, percival: 1 } })
    expect(result).toBeUndefined()
    expect(getRoom(uuid)?.config.roles.merlin).toBe(1)
    expect(getRoom(uuid)?.config.roles.percival).toBe(1)
  })

  it('已开始的游戏无法更新配置', async () => {
    const { updateGameOptions, startGame } = await loadInstances()
    const { createRoom, joinRoom } = await loadRooms()
    const uuid = await createRoom('leader')
    for (let i = 2; i <= 5; i++) {
      await joinRoom(uuid, `p${i}`)
    }
    await startGame(uuid, 'leader')
    const result = await updateGameOptions(uuid, 'leader', { roles: { merlin: 1 } })
    expect(result).toEqual({ error: 'errorGameAlreadyStarted' })
  })
})

describe('broadcastGameTo', () => {
  it('向指定玩家广播游戏状态', async () => {
    const uuid = await setupGameHelper()
    const { broadcastGameTo } = await loadInstances()
    await broadcastGameTo(uuid, 'leader')
    // 验证 emit 被调用
    expect(fakeIo.emit).toHaveBeenCalledWith('gameUpdated', expect.any(Object))
  })

  it('房间不存在时不广播', async () => {
    const { broadcastGameTo } = await loadInstances()
    fakeIo.emit.mockReset()
    broadcastGameTo('nonexistent', 'leader')
    expect(fakeIo.emit).not.toHaveBeenCalled()
  })
})

// 辅助函数：创建并启动一局游戏
async function setupGameHelper(): Promise<string> {
  const { startGame } = await loadInstances()
  const { createRoom, joinRoom } = await loadRooms()
  const uuid = await createRoom('leader')
  for (let i = 2; i <= 5; i++) {
    await joinRoom(uuid, `p${i}`)
  }
  await startGame(uuid, 'leader')
  return uuid
}
