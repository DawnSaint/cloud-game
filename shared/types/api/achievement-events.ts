import type {
  TAchievementUnlockedPayload,
  TAchievementProgressPayload,
  TGetAllAchievementsResponse,
  TGetUserAchievementsResponse,
} from '../stats/achievement'

/** 成就系统服务端 → 客户端事件。 */
export interface AchievementServerToClientEvents {
  /** 成就解锁时广播。 */
  achievementUnlocked: (payload: TAchievementUnlockedPayload) => void
  /** 成就进度更新时广播。 */
  achievementProgress: (payload: TAchievementProgressPayload) => void
}

/** 成就系统客户端 → 服务端事件。 */
export interface AchievementClientToServerEvents {
  /** 获取全量成就定义。 */
  getAllAchievements: (cb: (res: TGetAllAchievementsResponse) => void) => void
  /** 获取单个玩家的成就进度。 */
  getUserAchievements: (userId: string, cb: (res: TGetUserAchievementsResponse) => void) => void
}
