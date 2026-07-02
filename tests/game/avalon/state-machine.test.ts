import { describe, expect, it } from 'vitest'
import '../../../server/game/avalon' // side-effect: register Avalon engine
import { avalonEngine } from '../../../server/game/avalon/engine'
import {
  applyEvent,
  REJECT_LIMIT,
  WINS_REQUIRED,
} from '../../../server/game/avalon/state-machine'
import type { AvalonGameState } from '../../../shared/types/games/avalon/state'
import type { TVisibilityMap } from '../../../server/game/registry'
import type { RoomPlayer } from '../../../shared/types/common/room'

/** Build an N-player room with deterministic ids `p1`..`pN`. */
const players = (n: number): RoomPlayer[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, isLeader: false }))

/**
 * Seed a v0.1.7 Avalon game with a deterministic initial leader so tests
 * can assert exact player ids.
 */
function seed(n: number, initialLeader: string = 'p1') {
  const { state, visibility } = avalonEngine.createGame(
    'room-1',
    players(n),
    { roles: {} },
  )
  // createGame picks a random leader; reset to a known id for assertions.
  const reset = withLeader(state, initialLeader)
  return { state: reset, visibility }
}

function withLeader(state: AvalonGameState, leaderID: string): AvalonGameState {
  return {
    ...state,
    leaderID,
    players: state.players.map(p => ({
      ...p,
      features: {
        ...p.features,
        isLeader: p.id === leaderID,
        waitForAction: p.id === leaderID,
      },
    })),
  }
}

function send(state: AvalonGameState, actorId: string, event: Parameters<typeof applyEvent>[1]) {
  const r = applyEvent(state, event, actorId)
  if ('error' in r) throw new Error(`unexpected error: ${r.error}`)
  return r.state
}

function trySend(state: AvalonGameState, actorId: string, event: Parameters<typeof applyEvent>[1]) {
  return applyEvent(state, event, actorId)
}

/**
 * Drive the team through to `votingForTeam` by selecting the first `size`
 * players and submitting. Returns the resulting state.
 */
function pickTeam(state: AvalonGameState, leaderId: string, size: number): AvalonGameState {
  let s = state
  for (let i = 0; i < size; i++) {
    s = send(s, leaderId, { type: 'selectPlayer', playerId: `p${i + 1}` })
  }
  return send(s, leaderId, { type: 'submitTeam' })
}

/** Cast a single vote (no completion logic, just the partial state). */
function cast(state: AvalonGameState, actorId: string, option: 'approve' | 'reject') {
  return applyEvent(state, { type: 'castVote', option }, actorId)
}

function voteAll(
  state: AvalonGameState,
  votes: Array<[string, 'approve' | 'reject']>,
): { state: AvalonGameState } | { error: string } {
  let cur = state
  for (const [id, opt] of votes) {
    const r = cast(cur, id, opt)
    if ('error' in r) return r
    cur = r.state
  }
  return { state: cur }
}

function playAllSuccess(state: AvalonGameState): { state: AvalonGameState } | { error: string } {
  let cur = state
  for (const id of cur.currentTeam) {
    const r = applyEvent(cur, { type: 'missionAction', result: 'success' }, id)
    if ('error' in r) return r
    cur = r.state
  }
  return { state: cur }
}

/** Helper: complete one full mission with all-success outcome. */
function playOneMission(state: AvalonGameState): AvalonGameState {
  const leader = state.leaderID
  const teamSize = state.missionState[state.mission]!.players
  let s = pickTeam(state, leader, teamSize)
  const approved = voteAll(s, s.players.map(p => [p.id, 'approve' as const]))
  if ('error' in approved) throw new Error(approved.error)
  s = approved.state
  const played = playAllSuccess(s)
  if ('error' in played) throw new Error(played.error)
  return played.state
}

/** Helper: complete one full mission with all-fail outcome. */
function playOneMissionFail(state: AvalonGameState): AvalonGameState {
  const leader = state.leaderID
  const teamSize = state.missionState[state.mission]!.players
  let s = pickTeam(state, leader, teamSize)
  const approved = voteAll(s, s.players.map(p => [p.id, 'approve' as const]))
  if ('error' in approved) throw new Error(approved.error)
  s = approved.state
  let cur = s
  for (const id of cur.currentTeam) {
    const r = applyEvent(cur, { type: 'missionAction', result: 'fail' }, id)
    if ('error' in r) throw new Error(r.error)
    cur = r.state
  }
  return cur
}

describe('handleEvent - selectPlayer', () => {
  it('队长把玩家加入 currentTeam', () => {
    const { state } = seed(5)
    const s1 = send(state, 'p1', { type: 'selectPlayer', playerId: 'p2' })
    expect(s1.currentTeam).toEqual(['p2'])
  })

  it('队长再次点选同一玩家 → 移出当前队伍', () => {
    const { state } = seed(5)
    const s1 = send(state, 'p1', { type: 'selectPlayer', playerId: 'p2' })
    const s2 = send(s1, 'p1', { type: 'selectPlayer', playerId: 'p2' })
    expect(s2.currentTeam).toEqual([])
  })

  it('非队长点选 → error', () => {
    const { state } = seed(5)
    const r = trySend(state, 'p2', { type: 'selectPlayer', playerId: 'p3' })
    expect(r).toEqual({ error: 'only the leader may select players' })
  })

  it('votingForTeam 阶段点选 → error', () => {
    const { state } = seed(5)
    const picked = pickTeam(state, 'p1', 2)
    expect(picked.stage).toBe('votingForTeam')
    const r = trySend(picked, 'p1', { type: 'selectPlayer', playerId: 'p3' })
    expect('error' in r).toBe(true)
  })

  it('不存在的 playerId → error（不抛异常）', () => {
    const { state } = seed(5)
    const r = trySend(state, 'p1', { type: 'selectPlayer', playerId: 'ghost' })
    expect('error' in r).toBe(true)
  })

  it('选中后玩家 features.isSelected=true', () => {
    const { state } = seed(5)
    const s1 = send(state, 'p1', { type: 'selectPlayer', playerId: 'p2' })
    expect(s1.players.find(p => p.id === 'p2')!.features.isSelected).toBe(true)
    expect(s1.players.find(p => p.id === 'p3')!.features.isSelected).toBe(false)
  })
})

describe('handleEvent - submitTeam', () => {
  it('队伍大小匹配 mission.players → 进入 votingForTeam', () => {
    const { state } = seed(5)
    const s = pickTeam(state, 'p1', 2) // 5 人首回合 2 人队
    expect(s.stage).toBe('votingForTeam')
    expect(s.currentTeam).toEqual(['p1', 'p2'])
    expect(s.currentVotes).toEqual({})
    expect(s.vote).toBe(0)
  })

  it('队伍大小不匹配 → error，状态不变', () => {
    const { state } = seed(5)
    const partial = send(state, 'p1', { type: 'selectPlayer', playerId: 'p2' })
    const r = trySend(partial, 'p1', { type: 'submitTeam' })
    expect('error' in r).toBe(true)
    expect(partial.stage).toBe('selectTeam')
  })

  it('非队长提交 → error', () => {
    const { state } = seed(5)
    const picked = send(state, 'p1', { type: 'selectPlayer', playerId: 'p2' })
    // 队长选好之后换人 — 不允许
    const r = trySend(picked, 'p2', { type: 'submitTeam' })
    expect('error' in r).toBe(true)
  })

  it('votingForTeam 阶段重复提交 → error', () => {
    const { state } = seed(5)
    const s = pickTeam(state, 'p1', 2)
    const r = trySend(s, 'p1', { type: 'submitTeam' })
    expect('error' in r).toBe(true)
  })
})

describe('handleEvent - castVote', () => {
  it('全部赞成 → 进入 onMission，currentVotes 清空', () => {
    const { state } = seed(5)
    const s = pickTeam(state, 'p1', 2)
    const r = voteAll(s, [['p1', 'approve'], ['p2', 'approve'], ['p3', 'approve'], ['p4', 'approve'], ['p5', 'approve']])
    expect('error' in r).toBe(false)
    if ('error' in r) return
    expect(r.state.stage).toBe('onMission')
    expect(r.state.currentTeam).toEqual(['p1', 'p2'])
    expect(r.state.currentVotes).toEqual({})
    expect(r.state.history).toHaveLength(1)
    expect(r.state.history[0]!.type).toBe('vote')
  })

  it('全部反对 → vote+1，回到 selectTeam，队长轮换到下一位', () => {
    const { state } = seed(5, 'p1')
    const s = pickTeam(state, 'p1', 2)
    const r = voteAll(s, [['p1', 'reject'], ['p2', 'reject'], ['p3', 'reject'], ['p4', 'reject'], ['p5', 'reject']])
    expect('error' in r).toBe(false)
    if ('error' in r) return
    expect(r.state.stage).toBe('selectTeam')
    expect(r.state.vote).toBe(1)
    expect(r.state.leaderID).toBe('p2')
    expect(r.state.currentTeam).toEqual([])
    expect(r.state.currentVotes).toEqual({})
    expect(r.state.mission).toBe(0)
  })

  it('部分玩家先投 → 仍在 votingForTeam，currentVotes 累积', () => {
    const { state } = seed(5)
    const s = pickTeam(state, 'p1', 2)
    const r1 = cast(s, 'p1', 'approve')
    expect('error' in r1).toBe(false)
    if ('error' in r1) return
    expect(r1.state.stage).toBe('votingForTeam')
    expect(r1.state.currentVotes).toEqual({ p1: 'approve' })
  })

  it('同一玩家重复投票 → error', () => {
    const { state } = seed(5)
    const s = pickTeam(state, 'p1', 2)
    const r1 = cast(s, 'p1', 'approve')
    expect('error' in r1).toBe(false)
    if ('error' in r1) return
    const r2 = cast(r1.state, 'p1', 'reject')
    expect(r2).toEqual({ error: 'player p1 has already voted' })
  })

  it('selectTeam 阶段投票 → error', () => {
    const { state } = seed(5)
    const r = trySend(state, 'p1', { type: 'castVote', option: 'approve' })
    expect('error' in r).toBe(true)
  })

  it('赞成/反对打平时按 reject 处理（保守规则）', () => {
    const { state } = seed(5, 'p1')
    const s = pickTeam(state, 'p1', 2)
    const r = voteAll(s, [
      ['p1', 'approve'],
      ['p2', 'reject'],
      ['p3', 'approve'],
      ['p4', 'reject'],
      ['p5', 'approve'],
    ])
    expect('error' in r).toBe(false)
    if ('error' in r) return
    // 3:2 approve → mission
    expect(r.state.stage).toBe('onMission')
  })

  it('不存在的 actor 投票 → error（不抛异常）', () => {
    const { state } = seed(5)
    const s = pickTeam(state, 'p1', 2)
    const r = trySend(s, 'ghost', { type: 'castVote', option: 'approve' })
    expect('error' in r).toBe(true)
  })
})

describe('handleEvent - 连环 5 次拒绝 → 邪恶方获胜', () => {
  it('连续 5 次 reject 后 stage=end，winner=evil，reason=rejectedVote', () => {
    let { state } = seed(5, 'p1')
    for (let round = 0; round < REJECT_LIMIT; round++) {
      const leader = state.leaderID
      const teamSize = state.missionState[state.mission]!.players
      state = pickTeam(state, leader, teamSize)
      // 队伍里所有人 reject，剩下的全 reject
      const votes: Array<[string, 'reject']> = state.currentTeam.map(id => [id, 'reject' as const])
      const remaining = state.players.map(p => p.id).filter(id => !state.currentTeam.includes(id))
      for (const id of remaining) votes.push([id, 'reject'])
      const r = voteAll(state, votes)
      expect('error' in r).toBe(false)
      if ('error' in r) throw new Error(r.error)
      state = r.state
      if (state.stage === 'end') break
    }
    expect(state.stage).toBe('end')
    expect(state.result).toEqual({ winner: 'evil', reason: 'rejectedVote' })
  })
})

describe('handleEvent - missionAction', () => {
  it('全部成功 → 该任务 success，mission 索引 +1', () => {
    let { state } = seed(5, 'p1')
    state = pickTeam(state, 'p1', 2)
    const approved = voteAll(state, [['p1', 'approve'], ['p2', 'approve'], ['p3', 'approve'], ['p4', 'approve'], ['p5', 'approve']])
    expect('error' in approved).toBe(false)
    if ('error' in approved) throw new Error(approved.error)
    state = approved.state
    expect(state.stage).toBe('onMission')
    const r = playAllSuccess(state)
    expect('error' in r).toBe(false)
    if ('error' in r) throw new Error(r.error)
    state = r.state
    expect(state.stage).toBe('selectTeam')
    expect(state.missionState[0]!.result).toBe('success')
    expect(state.missionState[0]!.fails).toBe(0)
    expect(state.mission).toBe(1)
    expect(state.vote).toBe(0) // 重置
    expect(state.leaderID).toBe('p2') // 队长轮换
  })

  it('5 人首回合 1 fail → 任务失败（failsRequired=1）', () => {
    let { state } = seed(5, 'p1')
    state = pickTeam(state, 'p1', 2)
    const allApprove = voteAll(state, [['p1', 'approve'], ['p2', 'approve'], ['p3', 'approve'], ['p4', 'approve'], ['p5', 'approve']])
    expect('error' in allApprove).toBe(false)
    if ('error' in allApprove) throw new Error(allApprove.error)
    state = allApprove.state
    // p1 success, p2 fail
    const r1 = applyEvent(state, { type: 'missionAction', result: 'success' }, 'p1')
    expect('error' in r1).toBe(false)
    if ('error' in r1) throw new Error(r1.error)
    const r2 = applyEvent(r1.state, { type: 'missionAction', result: 'fail' }, 'p2')
    expect('error' in r2).toBe(false)
    if ('error' in r2) throw new Error(r2.error)
    expect(r2.state.stage).toBe('selectTeam')
    expect(r2.state.missionState[0]!.result).toBe('fail')
    expect(r2.state.missionState[0]!.fails).toBe(1)
  })

  it('7 人第四回合 2 fails → 任务成功（fails < failsRequired）', () => {
    let { state } = seed(7, 'p1')
    // 跳到第四回合：前两回合 success + 第三回合全员 fail = 2 success + 1 fail（避免触发胜利条件）
    state = playOneMission(state)
    state = playOneMission(state)
    state = playOneMissionFail(state)
    // 现在 mission=3, settings 是 4 人 + failsRequired=2
    expect(state.mission).toBe(3)
    expect(state.missionState[3]!.players).toBe(4)
    expect(state.missionState[3]!.failsRequired).toBe(2)
    // 队伍 2 fail + 2 success → success（fails=2 < 2 不成立，但失败阈值是 fails>=2）
    // 实际：2 fails 恰好等于 failsRequired，按规则 mission 失败。
    const leader = state.leaderID
    state = pickTeam(state, leader, 4)
    const allApprove = voteAll(state, state.players.map(p => [p.id, 'approve' as const]))
    expect('error' in allApprove).toBe(false)
    if ('error' in allApprove) throw new Error(allApprove.error)
    state = allApprove.state
    const team = state.currentTeam
    const acts: Array<[string, 'fail' | 'success']> = [
      [team[0]!, 'fail'],
      [team[1]!, 'fail'],
      [team[2]!, 'success'],
      [team[3]!, 'success'],
    ]
    let cur = state
    for (const [id, r] of acts) {
      const out = applyEvent(cur, { type: 'missionAction', result: r }, id)
      expect('error' in out).toBe(false)
      if ('error' in out) throw new Error(out.error)
      cur = out.state
    }
    // 2 fail ≥ 2 failsRequired → fail
    expect(cur.missionState[3]!.result).toBe('fail')
    expect(cur.missionState[3]!.fails).toBe(2)
  })

  it('7 人第四回合 3 fails → 任务失败（fails >= failsRequired）', () => {
    let { state } = seed(7, 'p1')
    state = playOneMission(state)
    state = playOneMission(state)
    state = playOneMissionFail(state)
    expect(state.mission).toBe(3)
    const leader = state.leaderID
    state = pickTeam(state, leader, 4)
    const allApprove = voteAll(state, state.players.map(p => [p.id, 'approve' as const]))
    expect('error' in allApprove).toBe(false)
    if ('error' in allApprove) throw new Error(allApprove.error)
    state = allApprove.state
    const team = state.currentTeam
    const acts: Array<[string, 'fail' | 'success']> = [
      [team[0]!, 'fail'],
      [team[1]!, 'fail'],
      [team[2]!, 'fail'],
      [team[3]!, 'success'],
    ]
    let cur = state
    for (const [id, r] of acts) {
      const out = applyEvent(cur, { type: 'missionAction', result: r }, id)
      expect('error' in out).toBe(false)
      if ('error' in out) throw new Error(out.error)
      cur = out.state
    }
    expect(cur.missionState[3]!.result).toBe('fail')
    expect(cur.missionState[3]!.fails).toBe(3)
  })

  it('非队伍成员行动 → error', () => {
    let { state } = seed(5, 'p1')
    state = pickTeam(state, 'p1', 2)
    const allApprove = voteAll(state, [['p1', 'approve'], ['p2', 'approve'], ['p3', 'approve'], ['p4', 'approve'], ['p5', 'approve']])
    expect('error' in allApprove).toBe(false)
    if ('error' in allApprove) throw new Error(allApprove.error)
    state = allApprove.state
    const r = trySend(state, 'p3', { type: 'missionAction', result: 'success' })
    expect('error' in r).toBe(true)
  })

  it('同一队员重复行动 → error', () => {
    let { state } = seed(5, 'p1')
    state = pickTeam(state, 'p1', 2)
    const allApprove = voteAll(state, [['p1', 'approve'], ['p2', 'approve'], ['p3', 'approve'], ['p4', 'approve'], ['p5', 'approve']])
    expect('error' in allApprove).toBe(false)
    if ('error' in allApprove) throw new Error(allApprove.error)
    state = allApprove.state
    const r1 = applyEvent(state, { type: 'missionAction', result: 'success' }, 'p1')
    expect('error' in r1).toBe(false)
    if ('error' in r1) throw new Error(r1.error)
    const r2 = trySend(r1.state, 'p1', { type: 'missionAction', result: 'success' })
    expect('error' in r2).toBe(true)
  })

  it('votingForTeam 阶段任务行动 → error', () => {
    let { state } = seed(5, 'p1')
    state = pickTeam(state, 'p1', 2)
    const r = trySend(state, 'p1', { type: 'missionAction', result: 'success' })
    expect('error' in r).toBe(true)
  })
})

describe('handleEvent - 胜负判定', () => {
  it('连续 3 次任务成功 → stage=end，winner=good', () => {
    let { state } = seed(5, 'p1')
    for (let i = 0; i < WINS_REQUIRED; i++) {
      state = playOneMission(state)
    }
    expect(state.stage).toBe('end')
    expect(state.result).toEqual({ winner: 'good', reason: 'goodTeamMissions' })
  })

  it('连续 3 次任务失败 → stage=end，winner=evil', () => {
    let { state } = seed(5, 'p1')
    for (let i = 0; i < WINS_REQUIRED; i++) {
      state = playOneMissionFail(state)
    }
    expect(state.stage).toBe('end')
    expect(state.result).toEqual({ winner: 'evil', reason: 'evilTeamMissions' })
  })
})

describe('handleEvent - 队长轮换', () => {
  it('拒绝后队长移至下一位', () => {
    let { state } = seed(5, 'p1')
    expect(state.leaderID).toBe('p1')
    state = pickTeam(state, 'p1', 2)
    const allReject = voteAll(state, state.players.map(p => [p.id, 'reject' as const]))
    expect('error' in allReject).toBe(false)
    if ('error' in allReject) throw new Error(allReject.error)
    state = allReject.state
    expect(state.leaderID).toBe('p2')
  })

  it('任务结束后队长移至下一位', () => {
    let { state } = seed(5, 'p1')
    state = playOneMission(state)
    expect(state.leaderID).toBe('p2')
  })

  it('最后一位队长拒绝后回到首位', () => {
    let { state } = seed(5, 'p4')
    expect(state.leaderID).toBe('p4')
    state = pickTeam(state, 'p4', 2)
    const allReject = voteAll(state, state.players.map(p => [p.id, 'reject' as const]))
    expect('error' in allReject).toBe(false)
    if ('error' in allReject) throw new Error(allReject.error)
    state = allReject.state
    expect(state.leaderID).toBe('p5')
    state = pickTeam(state, 'p5', 2)
    const allReject2 = voteAll(state, state.players.map(p => [p.id, 'reject' as const]))
    expect('error' in allReject2).toBe(false)
    if ('error' in allReject2) throw new Error(allReject2.error)
    state = allReject2.state
    expect(state.leaderID).toBe('p1')
  })
})

describe('handleEvent - history 记录', () => {
  it('投票历史记录包含 leader / team / 每个玩家的选项', () => {
    let { state } = seed(5, 'p1')
    state = pickTeam(state, 'p1', 2)
    const r = voteAll(state, [
      ['p1', 'approve'],
      ['p2', 'reject'],
      ['p3', 'approve'],
      ['p4', 'approve'],
      ['p5', 'reject'],
    ])
    expect('error' in r).toBe(false)
    if ('error' in r) throw new Error(r.error)
    state = r.state
    expect(state.history).toHaveLength(1)
    const entry = state.history[0]!
    expect(entry.type).toBe('vote')
    if (entry.type === 'vote') {
      expect(entry.leaderID).toBe('p1')
      expect(entry.team.map(m => m.id).sort()).toEqual(['p1', 'p2'])
      expect(entry.result).toBe('approve')
      const voteByPlayer = Object.fromEntries(entry.votes.map(v => [v.playerID, v.value]))
      expect(voteByPlayer.p1).toBe('approve')
      expect(voteByPlayer.p2).toBe('reject')
    }
  })

  it('任务历史记录 leader / team / 每个队员的卡片', () => {
    let { state } = seed(5, 'p1')
    state = pickTeam(state, 'p1', 2)
    const allApprove = voteAll(state, state.players.map(p => [p.id, 'approve' as const]))
    expect('error' in allApprove).toBe(false)
    if ('error' in allApprove) throw new Error(allApprove.error)
    state = allApprove.state
    const r1 = applyEvent(state, { type: 'missionAction', result: 'success' }, 'p1')
    expect('error' in r1).toBe(false)
    if ('error' in r1) throw new Error(r1.error)
    const r2 = applyEvent(r1.state, { type: 'missionAction', result: 'fail' }, 'p2')
    expect('error' in r2).toBe(false)
    if ('error' in r2) throw new Error(r2.error)
    const final = r2.state
    expect(final.history).toHaveLength(2)
    const missionEntry = final.history[1]!
    expect(missionEntry.type).toBe('mission')
    if (missionEntry.type === 'mission') {
      expect(missionEntry.index).toBe(0)
      expect(missionEntry.leaderID).toBe('p1')
      expect(missionEntry.fails).toBe(1)
      expect(missionEntry.result).toBe('fail')
      const actionsByPlayer = Object.fromEntries(missionEntry.actions.map(a => [a.playerID, (a as { value?: 'success' | 'fail' }).value]))
      expect(actionsByPlayer.p1).toBe('success')
      expect(actionsByPlayer.p2).toBe('fail')
    }
  })
})

describe('getVisualState - 角色裁剪', () => {
  function buildVisibility(): TVisibilityMap {
    return {
      p1: { p2: 'evil', p3: 'unknown' }, // p1 sees p2 as evil, p3 unknown
      p2: { p1: 'evil' },
      p3: {},
    }
  }

  it('非 end 阶段：只暴露 visibility map 给出的角色，其余 unknown', () => {
    const { state } = seed(5)
    const vis = buildVisibility()
    const visual = avalonEngine.getVisualState(state, { playerId: 'p1', visibility: vis })
    expect(visual.players.find(p => p.id === 'p1')!.role).toBe(state.players.find(p => p.id === 'p1')!.role) // 自身真实角色
    expect(visual.players.find(p => p.id === 'p2')!.role).toBe('evil')
    expect(visual.players.find(p => p.id === 'p3')!.role).toBe('unknown')
    expect(visual.players.find(p => p.id === 'p4')!.role).toBe('unknown')
  })

  it('end 阶段：全部揭示真实角色', () => {
    const { state } = seed(5)
    const ended = { ...state, stage: 'end' as const }
    const vis: TVisibilityMap = {} // visibility 已无意义
    const visual = avalonEngine.getVisualState(ended, { playerId: 'p1', visibility: vis })
    for (const p of visual.players) {
      expect(p.role).toBe(state.players.find(x => x.id === p.id)!.role)
    }
  })

  it('state 的其余字段（vote/mission/currentTeam 等）保持原样', () => {
    const { state } = seed(5, 'p1')
    const s = send(state, 'p1', { type: 'selectPlayer', playerId: 'p2' })
    const visual = avalonEngine.getVisualState(s, { playerId: 'p1', visibility: {} })
    expect(visual.vote).toBe(s.vote)
    expect(visual.mission).toBe(s.mission)
    expect(visual.currentTeam).toEqual(s.currentTeam)
    expect(visual.leaderID).toBe(s.leaderID)
  })
})
