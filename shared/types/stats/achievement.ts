import type { TOptionalRoles } from '../games/avalon/roles'

/** 成就类型：公开（始终可见）或隐藏（解锁前不显示详情）。 */
export type TAchievementType = 'open' | 'hidden'

/**
 * 成就定义（服务端配置）。requirement 为进度目标值；
 * metadata 可选地限定角色或人数维度，用于详细进度追踪。
 */
export interface TAchievementDef {
  id: string
  name: string
  description: string
  type: TAchievementType
  /** 进度目标值（如胜场数）。 */
  requirement: number
  metadata?: {
    roles?: TOptionalRoles[]
    playerCounts?: number[]
  }
}

/** 单个玩家的成就进度。 */
export interface TUserAchievement {
  achievementID: string
  userID: string
  currentProgress: number
  completed: boolean
  /** 详细进度（如按角色/人数维度的完成状态）。 */
  state?: Record<string, boolean>
}

/** 服务端 → 客户端：全量成就定义列表。 */
export interface TGetAllAchievementsResponse {
  success: boolean
  achievements: TAchievementDef[]
}

/** 服务端 → 客户端：单个玩家的成就进度列表。 */
export interface TGetUserAchievementsResponse {
  success: boolean
  userAchievements: TUserAchievement[]
}

/** 服务端 → 客户端：成就解锁通知。 */
export interface TAchievementUnlockedPayload {
  achievementID: string
  name: string
}

/** 服务端 → 客户端：成就进度更新通知。 */
export interface TAchievementProgressPayload {
  achievementID: string
  name: string
  currentProgress: number
  requirement: number
}
