import { describe, expect, it } from 'vitest'
import '../../../server/game/avalon' // side-effect: register Avalon engine
import { avalonEngine } from '../../../server/game/avalon/engine'
import { getGameEngine, getAvailableGameTypes } from '../../../server/game/registry'
import { InvalidGameConfigError } from '../../../server/game/avalon/role-assignment'
import { SUPPORTED_ROLES } from '../../../server/game/avalon/roles'
import type { RoomPlayer } from '../../../shared/types/common/room'

const players = (n: number): RoomPlayer[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, isLeader: false }))

describe('Game Registry', () => {
  it('getGameEngine("avalon") 返回已注册的引擎', () => {
    expect(getGameEngine('avalon')).toBe(avalonEngine)
  })

  it('getAvailableGameTypes() 包含 "avalon"', () => {
    expect(getAvailableGameTypes()).toContain('avalon')
  })
})

describe('avalonEngine — 元信息', () => {
  it('gameType / 人数范围正确', () => {
    expect(avalonEngine.gameType).toBe('avalon')
    expect(avalonEngine.minPlayers).toBe(5)
    expect(avalonEngine.maxPlayers).toBe(10)
  })
})

describe('avalonEngine.createGame', () => {
  it('5 人 merlin+morgana+percival 配置产出合法的初始化状态', () => {
    const roomId = 'room-xyz'
    const ps = players(5)
    const { state, visibility } = avalonEngine.createGame(roomId, ps, {
      roles: { merlin: 1, morgana: 1, percival: 1 },
    })

    expect(state.uuid).toBe(roomId)
    // v0.1.7: round state machine initializes inside createGame, so the
    // authoritative state is already in 'selectTeam' (first leader waiting).
    expect(state.stage).toBe('selectTeam')
    expect(state.vote).toBe(0)
    expect(state.mission).toBe(0)
    expect(state.history).toEqual([])
    expect(state.missionState).toHaveLength(5)
    expect(state.players).toHaveLength(5)
    // Runtime fields are seeded for the round state machine.
    expect(state.leaderID).toMatch(/^p[1-5]$/)
    expect(state.currentTeam).toEqual([])
    expect(state.currentVotes).toEqual({})
    expect(state.currentActions).toEqual({})
    expect(state.players.find(p => p.id === state.leaderID)!.features.isLeader).toBe(true)
    expect(state.players.find(p => p.id === state.leaderID)!.features.waitForAction).toBe(true)

    // 每个玩家拿到 v0.1.6 支持集合内的角色
    for (const p of state.players) {
      expect(SUPPORTED_ROLES.has(p.role)).toBe(true)
    }

    // 角色构成：1 梅林 + 1 派西维尔 + 1 莫甘娜 + 1 爪牙 + 1 忠臣
    const roleCounts = state.players.reduce<Record<string, number>>((acc, p) => {
      acc[p.role] = (acc[p.role] ?? 0) + 1
      return acc
    }, {})
    expect(roleCounts).toEqual({ merlin: 1, percival: 1, morgana: 1, minion: 1, servant: 1 })
  })

  it('visibility 包含每位玩家，且梅林看到邪恶方为 evil', () => {
    const ps = players(5)
    const { state, visibility } = avalonEngine.createGame('r', ps, {
      roles: { merlin: 1, morgana: 1, percival: 1 },
    })

    // 每个玩家在 visibility 中有一条记录
    for (const p of state.players) {
      expect(visibility[p.id]).toBeDefined()
    }

    // 找到梅林玩家，验证其看到所有邪恶方为 evil
    const merlin = state.players.find(p => p.role === 'merlin')!
    const evils = state.players.filter(p => p.role === 'morgana' || p.role === 'minion')
    for (const e of evils) {
      expect(visibility[merlin.id][e.id]).toBe('evil')
    }
    // 梅林看不到其他好人
    const goods = state.players.filter(p => p.role === 'servant' || p.role === 'percival')
    for (const g of goods) {
      expect(visibility[merlin.id][g.id]).toBeUndefined()
    }
  })

  it('玩家数不足 5 抛 InvalidGameConfigError', () => {
    expect(() => avalonEngine.createGame('r', players(4), { roles: {} })).toThrow(InvalidGameConfigError)
  })

  it('玩家数超过 10 抛 InvalidGameConfigError', () => {
    expect(() => avalonEngine.createGame('r', players(11), { roles: {} })).toThrow(InvalidGameConfigError)
  })
})
