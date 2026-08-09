import type {
  TAchievementDef,
  TUserAchievement,
  TGetAllAchievementsResponse,
  TGetUserAchievementsResponse,
  TAchievementUnlockedPayload,
  TAchievementProgressPayload,
} from '../../../shared/types/stats/achievement'

/**
 * 成就系统：管理成就定义与玩家进度。
 *
 * v0.1.12 采用内存存储（与房间系统一致），成就定义硬编码，
 * 玩家进度按 userId 索引。后续可迁移至 MongoDB 持久化。
 */

/** 成就定义表（服务端配置）。 */
const ACHIEVEMENTS: TAchievementDef[] = [
  {
    id: 'first_win',
    name: '首胜',
    description: '赢得第一场阿瓦隆对局',
    type: 'open',
    requirement: 1,
  },
  {
    id: 'good_veteran',
    name: '善良老兵',
    description: '以善良方身份赢得 10 场对局',
    type: 'open',
    requirement: 10,
  },
  {
    id: 'evil_veteran',
    name: '邪恶老兵',
    description: '以邪恶方身份赢得 10 场对局',
    type: 'open',
    requirement: 10,
  },
  {
    id: 'merlin_master',
    name: '梅林大师',
    description: '以梅林身份赢得 5 场对局',
    type: 'open',
    requirement: 5,
    metadata: { roles: ['merlin'] },
  },
  {
    id: 'assassin',
    name: '刺客',
    description: '成功刺杀梅林 3 次',
    type: 'hidden',
    requirement: 3,
  },
  {
    id: 'centurion',
    name: '百夫长',
    description: '累计赢得 100 场对局',
    type: 'open',
    requirement: 100,
  },
]

/** 玩家成就进度：userId → achievementID → progress。 */
const progress = new Map<string, Map<string, TUserAchievement>>()

/** 获取（或初始化）玩家的成就进度映射。 */
function getUserMap(userId: string): Map<string, TUserAchievement> {
  let map = progress.get(userId)
  if (!map) {
    map = new Map()
    progress.set(userId, map)
  }
  return map
}

/** 全量成就定义。 */
export function getAllAchievements(): TGetAllAchievementsResponse {
  return { success: true, achievements: ACHIEVEMENTS }
}

/** 单个玩家的成就进度列表。 */
export function getUserAchievements(userId: string): TGetUserAchievementsResponse {
  const map = getUserMap(userId)
  return { success: true, userAchievements: [...map.values()] }
}

/**
 * 记录一场对局结果对成就进度的影响。
 * @param userId 玩家 id
 * @param won 是否获胜
 * @param role 本局角色
 * @param isAssassinKill 是否为本局刺客且成功刺杀梅林
 * @returns 解锁的成就列表（用于广播）
 */
export function recordGameResult(
  userId: string,
  won: boolean,
  role?: string,
  isAssassinKill?: boolean,
): TAchievementUnlockedPayload[] {
  const map = getUserMap(userId)
  const unlocked: TAchievementUnlockedPayload[] = []

  for (const def of ACHIEVEMENTS) {
    const current = map.get(def.id)
    if (current?.completed) continue

    let increment = 0
    let stateUpdate: Record<string, boolean> | undefined

    // 刺客刺杀成就（独立于胜负，仅看是否成功刺杀梅林）
    if (def.id === 'assassin' && isAssassinKill) {
      increment = 1
    }
    // 通用胜场成就
    else if (def.id === 'first_win' || def.id === 'centurion') {
      if (won) increment = 1
    }
    // 阵营胜场成就
    else if (def.id === 'good_veteran' || def.id === 'evil_veteran') {
      // 阵营由调用方通过 won + role 隐含；此处仅当 role 匹配阵营且获胜时增量
      if (won && role && matchesFaction(def.id, role)) {
        increment = 1
      }
    }
    // 角色限定成就
    else if (def.metadata?.roles && role && (def.metadata.roles as string[]).includes(role)) {
      if (won) increment = 1
      // 详细进度：标记该角色已完成
      stateUpdate = { ...current?.state, [role]: true }
    }

    if (increment <= 0 && !stateUpdate) continue

    const newProgress = (current?.currentProgress ?? 0) + increment
    const completed = newProgress >= def.requirement
    const updated: TUserAchievement = {
      achievementID: def.id,
      userID: userId,
      currentProgress: newProgress,
      completed,
      state: stateUpdate ?? current?.state,
    }
    map.set(def.id, updated)

    if (completed && !current?.completed) {
      unlocked.push({ achievementID: def.id, name: def.name })
    }
  }

  return unlocked
}

/** 判断角色是否匹配阵营胜场成就的阵营。 */
function matchesFaction(achievementId: string, role: string): boolean {
  const goodRoles = new Set(['merlin', 'percival', 'servant', 'merlinPure', 'tristan', 'isolde', 'goodLancelot', 'guinevere', 'troublemaker', 'cleric'])
  const evilRoles = new Set(['morgana', 'oberon', 'mordred', 'minion', 'evilLancelot', 'trickster', 'lunatic', 'brute', 'witch', 'revealer', 'wraith'])
  if (achievementId === 'good_veteran') return goodRoles.has(role)
  if (achievementId === 'evil_veteran') return evilRoles.has(role)
  return false
}

/** 获取成就进度的中间状态（用于前端进度条）。 */
export function getAchievementProgress(
  userId: string,
  achievementId: string,
): TAchievementProgressPayload | null {
  const map = getUserMap(userId)
  const current = map.get(achievementId)
  const def = ACHIEVEMENTS.find(a => a.id === achievementId)
  if (!def) return null
  return {
    achievementID: achievementId,
    name: def.name,
    currentProgress: current?.currentProgress ?? 0,
    requirement: def.requirement,
  }
}
