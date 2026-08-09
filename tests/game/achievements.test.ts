import { describe, expect, it, vi, beforeEach } from 'vitest'

// 每个用例重新导入以重置模块级进度 Map
beforeEach(() => {
  vi.resetModules()
})
const loadAchievements = async () => await import('../../../server/game/achievements')

describe('getAllAchievements', () => {
  it('返回预定义的成就列表', async () => {
    const { getAllAchievements } = await loadAchievements()
    const res = getAllAchievements()
    expect(res.success).toBe(true)
    expect(res.achievements.length).toBeGreaterThan(0)
    expect(res.achievements.some(a => a.id === 'first_win')).toBe(true)
    expect(res.achievements.some(a => a.id === 'assassin')).toBe(true)
  })
})

describe('getUserAchievements', () => {
  it('新用户返回空进度列表', async () => {
    const { getUserAchievements } = await loadAchievements()
    const res = getUserAchievements('new-user')
    expect(res.success).toBe(true)
    expect(res.userAchievements).toEqual([])
  })
})

describe('recordGameResult', () => {
  it('首胜成就：首次获胜即解锁', async () => {
    const { recordGameResult, getUserAchievements } = await loadAchievements()
    const unlocked = recordGameResult('player-1', true, 'servant')
    expect(unlocked.some(a => a.achievementID === 'first_win')).toBe(true)

    const progress = getUserAchievements('player-1')
    const firstWin = progress.userAchievements.find(a => a.achievementID === 'first_win')
    expect(firstWin?.completed).toBe(true)
    expect(firstWin?.currentProgress).toBe(1)
  })

  it('首胜成就：失败不增加进度', async () => {
    const { recordGameResult, getUserAchievements } = await loadAchievements()
    const unlocked = recordGameResult('player-2', false, 'servant')
    expect(unlocked.some(a => a.achievementID === 'first_win')).toBe(false)

    const progress = getUserAchievements('player-2')
    const firstWin = progress.userAchievements.find(a => a.achievementID === 'first_win')
    // 失败时不创建进度条目
    expect(firstWin).toBeUndefined()
  })

  it('善良老兵：善良方获胜进度 +1', async () => {
    const { recordGameResult, getUserAchievements } = await loadAchievements()
    // 善良方角色
    recordGameResult('player-3', true, 'merlin')
    recordGameResult('player-3', true, 'servant')
    const progress = getUserAchievements('player-3')
    const vet = progress.userAchievements.find(a => a.achievementID === 'good_veteran')
    expect(vet?.currentProgress).toBe(2)
  })

  it('善良老兵：邪恶方获胜不增加善良老兵进度', async () => {
    const { recordGameResult, getAchievementProgress } = await loadAchievements()
    recordGameResult('player-4', true, 'minion')
    const vet = getAchievementProgress('player-4', 'good_veteran')
    expect(vet?.currentProgress).toBe(0)
  })

  it('梅林大师：以梅林身份获胜进度 +1，并记录详细状态', async () => {
    const { recordGameResult, getUserAchievements } = await loadAchievements()
    recordGameResult('player-5', true, 'merlin')
    const progress = getUserAchievements('player-5')
    const merlin = progress.userAchievements.find(a => a.achievementID === 'merlin_master')
    expect(merlin?.currentProgress).toBe(1)
    expect(merlin?.state?.merlin).toBe(true)
  })

  it('刺客成就：成功刺杀梅林 3 次后解锁', async () => {
    const { recordGameResult, getAchievementProgress } = await loadAchievements()
    // 刺客成就 requirement=3，需成功刺杀 3 次
    recordGameResult('player-6', false, 'minion', true)
    recordGameResult('player-6', false, 'minion', true)
    const unlocked = recordGameResult('player-6', false, 'minion', true)
    expect(unlocked.some(a => a.achievementID === 'assassin')).toBe(true)

    const assassin = getAchievementProgress('player-6', 'assassin')
    expect(assassin?.currentProgress).toBe(3)
  })

  it('百夫长：累计胜场达到目标后解锁', async () => {
    const { recordGameResult, getUserAchievements } = await loadAchievements()
    let unlocked: Array<{ achievementID: string }> = []
    for (let i = 0; i < 100; i++) {
      unlocked = recordGameResult('player-7', true, 'servant')
    }
    expect(unlocked.some(a => a.achievementID === 'centurion')).toBe(true)

    const progress = getUserAchievements('player-7')
    const centurion = progress.userAchievements.find(a => a.achievementID === 'centurion')
    expect(centurion?.completed).toBe(true)
    expect(centurion?.currentProgress).toBe(100)
  })

  it('已完成的成就不再重复解锁', async () => {
    const { recordGameResult } = await loadAchievements()
    const first = recordGameResult('player-8', true, 'servant')
    const second = recordGameResult('player-8', true, 'servant')
    expect(first.some(a => a.achievementID === 'first_win')).toBe(true)
    expect(second.some(a => a.achievementID === 'first_win')).toBe(false)
  })
})

describe('getAchievementProgress', () => {
  it('返回指定成就的进度信息', async () => {
    const { recordGameResult, getAchievementProgress } = await loadAchievements()
    recordGameResult('player-9', true, 'servant')
    const progress = getAchievementProgress('player-9', 'first_win')
    expect(progress).not.toBeNull()
    expect(progress?.achievementID).toBe('first_win')
    expect(progress?.currentProgress).toBe(1)
    expect(progress?.requirement).toBe(1)
  })

  it('不存在的成就返回 null', async () => {
    const { getAchievementProgress } = await loadAchievements()
    const progress = getAchievementProgress('player-10', 'nonexistent')
    expect(progress).toBeNull()
  })
})
