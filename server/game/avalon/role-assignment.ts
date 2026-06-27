import type { TRoles, TLoyalty, TVisibleRole, TGoodRoles, TEvilRoles } from '../../../shared/types/games/avalon/roles'
import type { GameRoles, GameSettingsWithRoles } from '../../../shared/types/games/avalon/settings'
import type { AvalonGameConfig } from '../../../shared/types/games/avalon/options'
import { evilRolesImportance, goodRolesImportance } from '../../../shared/types/consts'
import { AVALON_ROLES, SUPPORTED_ROLES } from './roles'
import { GAMES_SETTINGS, MIN_PLAYERS, MAX_PLAYERS } from './presets'

/** A player's real (server-secret) role assignment. */
export interface TRoleAssignment {
  playerId: string
  role: TRoles
  loyalty: TLoyalty
}

export interface TAssignResult {
  /** Per-player real role, in the same order as the input playerIds. */
  assignment: TRoleAssignment[]
  /** Roles grouped by loyalty and sorted by importance (for the info-panel view). */
  roles: GameRoles
  /** Full settings including the role breakdown. */
  settings: GameSettingsWithRoles
}

export class InvalidGameConfigError extends Error {}

/** Fisher-Yates shuffle (no lodash dependency). Returns a new array. */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Assign roles to players for a new Avalon game.
 *
 * 1. Validate player count (5–10) and look up the preset good/evil split.
 * 2. Consume special roles from `config.roles` (capped at 1 each — no wtf-mode),
 *    rejecting roles unsupported in v0.1.6.
 * 3. Fill remaining evil seats with `minion`, good seats with `servant`.
 * 4. Shuffle so role↔player mapping is random.
 * Throws `InvalidGameConfigError` on any impossible configuration.
 */
export function assignRoles(playerIds: string[], config: AvalonGameConfig): TAssignResult {
  const count = playerIds.length
  if (count < MIN_PLAYERS || count > MAX_PLAYERS) {
    throw new InvalidGameConfigError(`玩家数需在 ${MIN_PLAYERS}-${MAX_PLAYERS} 之间，当前 ${count}`)
  }

  const base = GAMES_SETTINGS[count]
  const remaining = { good: base.players.good, evil: base.players.evil }
  const pool: TRoles[] = []

  for (const [roleName, inGame] of Object.entries(config.roles)) {
    if (!inGame) continue
    if (!SUPPORTED_ROLES.has(roleName as TRoles)) {
      throw new InvalidGameConfigError(`v0.1.6 暂不支持角色：${roleName}`)
    }
    const data = AVALON_ROLES[roleName as TRoles]
    // 无 wtf-mode：每个特殊角色至多 1 名
    const seats = Math.min(inGame, 1)
    for (let i = 0; i < seats; i++) {
      pool.push(data.role)
      remaining[data.loyalty] -= 1
    }
  }

  if (remaining.good < 0 || remaining.evil < 0) {
    throw new InvalidGameConfigError('所选特殊角色数超过阵营名额')
  }

  for (let i = 0; i < remaining.evil; i++) pool.push('minion')
  for (let i = 0; i < remaining.good; i++) pool.push('servant')

  const shuffled = shuffle(pool)

  const assignment: TRoleAssignment[] = playerIds.map((pid, idx) => ({
    playerId: pid,
    role: shuffled[idx],
    loyalty: AVALON_ROLES[shuffled[idx]].loyalty,
  }))

  const roles = calculateRolesForView(shuffled)
  const settings: GameSettingsWithRoles = { ...base, roles }

  return { assignment, roles, settings }
}

/** Group roles by loyalty and sort by importance (mirrors upstream calculateRolesForView). */
function calculateRolesForView(roles: readonly TRoles[]): GameRoles {
  const result: GameRoles = { evil: [], good: [] }
  for (const r of roles) {
    if (AVALON_ROLES[r].loyalty === 'good') {
      result.good.push(r as TGoodRoles)
    }
    else {
      result.evil.push(r as TEvilRoles)
    }
  }
  result.good.sort((a, b) => goodRolesImportance[a] - goodRolesImportance[b])
  result.evil.sort((a, b) => evilRolesImportance[a] - evilRolesImportance[b])
  return result
}

/**
 * Compute first-night visibility: for each observer, which targets they see
 * and as what role. An observer always sees themselves as their real role;
 * other players are visible only if the observer's role grants it.
 */
export function computeVisibility(assignment: readonly TRoleAssignment[]): Record<string, Record<string, TVisibleRole>> {
  const map: Record<string, Record<string, TVisibleRole>> = {}
  for (const observer of assignment) {
    const grants = AVALON_ROLES[observer.role].visibility
    const view: Record<string, TVisibleRole> = {}
    for (const target of assignment) {
      if (target.playerId === observer.playerId) {
        view[target.playerId] = observer.role
        continue
      }
      const seen = grants[target.role]
      if (seen) {
        view[target.playerId] = seen
      }
    }
    map[observer.playerId] = view
  }
  return map
}
