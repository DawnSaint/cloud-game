import { describe, expect, it } from 'vitest'
import {
  assignRoles,
  computeVisibility,
  InvalidGameConfigError,
  type TRoleAssignment,
} from '../../../server/game/avalon/role-assignment'
import { SUPPORTED_ROLES } from '../../../server/game/avalon/roles'
import { GAMES_SETTINGS } from '../../../server/game/avalon/presets'
import type { TRoles } from '../../../shared/types/games/avalon/roles'

const ids = (n: number) => Array.from({ length: n }, (_, i) => `p${i + 1}`)

function countRoles(assignment: TRoleAssignment[]): Record<string, number> {
  return assignment.reduce<Record<string, number>>((acc, a) => {
    acc[a.role] = (acc[a.role] ?? 0) + 1
    return acc
  }, {})
}

describe('assignRoles — 人数校验', () => {
  it('玩家数 < 5 抛 InvalidGameConfigError', () => {
    expect(() => assignRoles(ids(4), { roles: {} })).toThrow(InvalidGameConfigError)
  })

  it('玩家数 > 10 抛 InvalidGameConfigError', () => {
    expect(() => assignRoles(ids(11), { roles: {} })).toThrow(InvalidGameConfigError)
  })
})

describe('assignRoles — 角色分配', () => {
  it('5 人默认配置（无特殊角色）→ 3 忠臣 + 2 爪牙', () => {
    const { assignment, settings } = assignRoles(ids(5), { roles: {} })

    expect(assignment).toHaveLength(5)
    expect(countRoles(assignment)).toEqual({ servant: 3, minion: 2 })
    expect(settings.players).toEqual({ good: 3, evil: 2 })
  })

  it('5 人配置 merlin+morgana+percival → 各 1，余下 minion+servant 补位', () => {
    const { assignment } = assignRoles(ids(5), { roles: { merlin: 1, morgana: 1, percival: 1 } })

    expect(countRoles(assignment)).toEqual({
      merlin: 1,
      percival: 1,
      morgana: 1,
      minion: 1, // 邪恶方补位（2 邪恶 - 1 莫甘娜）
      servant: 1, // 好人方补位（3 好人 - 梅林 - 派西维尔）
    })
  })

  it('10 人配置 merlin+morgana+percival → 补位 4 servant + 3 minion', () => {
    const { assignment } = assignRoles(ids(10), { roles: { merlin: 1, morgana: 1, percival: 1 } })

    expect(countRoles(assignment)).toEqual({
      merlin: 1,
      percival: 1,
      morgana: 1,
      minion: 3, // 4 邪恶 - 1
      servant: 4, // 6 好人 - 2
    })
  })

  it('所有分配角色均落在 v0.1.6 支持集合内', () => {
    const { assignment } = assignRoles(ids(7), { roles: { merlin: 1, morgana: 1, percival: 1 } })
    for (const a of assignment) {
      expect(SUPPORTED_ROLES.has(a.role)).toBe(true)
    }
  })

  it('config 中 count > 1 时仍按 1 名处理（无 wtf-mode）', () => {
    const { assignment } = assignRoles(ids(5), { roles: { merlin: 5 } })
    expect(countRoles(assignment).merlin).toBe(1)
  })
})

describe('assignRoles — v0.1.10 新增角色', () => {
  it('配置 mordred 成功分配（邪恶方名额足够）', () => {
    const { assignment } = assignRoles(ids(7), { roles: { mordred: 1 } })
    expect(assignment.some(a => a.role === 'mordred')).toBe(true)
  })

  it('配置 oberon 成功分配（邪恶方名额足够）', () => {
    const { assignment } = assignRoles(ids(5), { roles: { oberon: 1 } })
    expect(assignment.some(a => a.role === 'oberon')).toBe(true)
  })

  it('mordred + merlin + morgana + percival 组合可分配', () => {
    const { assignment, settings } = assignRoles(ids(7), {
      roles: { merlin: 1, percival: 1, morgana: 1, mordred: 1, oberon: 1 },
    })
    const roles = assignment.map(a => a.role)
    expect(roles).toContain('merlin')
    expect(roles).toContain('mordred')
    expect(roles).toContain('oberon')
    expect(settings.roles.evil).toContain('mordred')
    expect(settings.roles.evil).toContain('oberon')
  })
})

describe('assignRoles — 仍不支持的角色', () => {
  it('配置 guinevere 抛 InvalidGameConfigError', () => {
    expect(() => assignRoles(ids(5), { roles: { guinevere: 1 } })).toThrow(InvalidGameConfigError)
  })

  it('配置 evilLancelot 抛 InvalidGameConfigError', () => {
    expect(() => assignRoles(ids(7), { roles: { evilLancelot: 1 } })).toThrow(InvalidGameConfigError)
  })
})

describe('assignRoles — 视图与预设', () => {
  it('roles 视图按 importance 排序（merlin < percival < servant；morgana < minion）', () => {
    const { roles } = assignRoles(ids(5), { roles: { merlin: 1, morgana: 1, percival: 1 } })

    expect(roles.good).toEqual(['merlin', 'percival', 'servant'])
    expect(roles.evil).toEqual(['morgana', 'minion'])
  })

  it('settings.missions 与按人数查表的预设一致', () => {
    const { settings } = assignRoles(ids(7), { roles: {} })
    expect(settings.missions).toEqual(GAMES_SETTINGS[7].missions)
    expect(settings.total).toBe(7)
  })
})

describe('assignRoles — 随机性', () => {
  it('多次分配产生至少 2 种不同的 角色↔玩家 映射', () => {
    const mappings = new Set<string>()
    for (let i = 0; i < 60; i++) {
      const { assignment } = assignRoles(ids(5), { roles: { merlin: 1, morgana: 1, percival: 1 } })
      mappings.add(assignment.map(a => `${a.playerId}:${a.role}`).join('|'))
    }
    // 5 人该配置有 5! / (1·1·1·1·1) = 120 种排列，60 次抽样应至少出现 2 种
    expect(mappings.size).toBeGreaterThan(1)
  })
})

// ---- computeVisibility：用固定 assignment 保证确定性 ----
const FIXED: TRoleAssignment[] = [
  { playerId: 'p1', role: 'merlin', loyalty: 'good' },
  { playerId: 'p2', role: 'percival', loyalty: 'good' },
  { playerId: 'p3', role: 'servant', loyalty: 'good' },
  { playerId: 'p4', role: 'morgana', loyalty: 'evil' },
  { playerId: 'p5', role: 'minion', loyalty: 'evil' },
]

describe('computeVisibility — 首夜信息', () => {
  const vis = computeVisibility(FIXED)

  it('梅林看到所有邪恶方为 evil，看不到好人', () => {
    expect(vis.p1.p4).toBe('evil')
    expect(vis.p1.p5).toBe('evil')
    expect(vis.p1.p2).toBeUndefined()
    expect(vis.p1.p3).toBeUndefined()
  })

  it('派西维尔看到 merlin 与 morgana 为 mysteryWizard（无法区分），看不到其他人', () => {
    expect(vis.p2.p1).toBe('mysteryWizard')
    expect(vis.p2.p4).toBe('mysteryWizard')
    expect(vis.p2.p3).toBeUndefined()
    expect(vis.p2.p5).toBeUndefined()
  })

  it('忠臣首夜仅看到自己，看不到任何人', () => {
    expect(vis.p3.p1).toBeUndefined()
    expect(vis.p3.p4).toBeUndefined()
    expect(vis.p3.p5).toBeUndefined()
  })

  it('邪恶方互相可见为 evil（morgana 见 minion，minion 见 morgana）', () => {
    expect(vis.p4.p5).toBe('evil')
    expect(vis.p5.p4).toBe('evil')
    // 邪恶方看不到好人
    expect(vis.p4.p1).toBeUndefined()
    expect(vis.p5.p2).toBeUndefined()
  })

  it('每个玩家看到自己为真实角色', () => {
    for (const a of FIXED) {
      expect(vis[a.playerId][a.playerId]).toBe(a.role as TRoles)
    }
  })
})
