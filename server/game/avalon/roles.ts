import type { TRoles, TLoyalty, TVisibleRole } from '../../../shared/types/games/avalon/roles'

/**
 * Static data for a single Avalon role: loyalty + what an observer with this
 * role sees of other roles. Replaces the upstream `Character` class hierarchy
 * with a plain data table (no game-instance coupling needed for assignment).
 *
 * v0.1.6 scope: the five core roles only (梅林/派西维尔/忠臣/莫甘娜/爪牙).
 * Additional roles (奥伯伦/莫德雷德/...) are added in v0.4.x — until then
 * `assignRoles` rejects configs referencing roles absent from this table.
 */
export interface TAvalonRoleData {
  role: TRoles
  loyalty: TLoyalty
  /** observer with this role sees a target whose real role is the key as this TVisibleRole. */
  visibility: Partial<Record<TRoles, TVisibleRole>>
}

export const AVALON_ROLES: Record<TRoles, TAvalonRoleData> = {
  // Good
  merlin: {
    role: 'merlin',
    loyalty: 'good',
    // 梅林看到所有邪恶方（v0.1.6 仅 morgana/minion）为 'evil'
    visibility: { morgana: 'evil', minion: 'evil' },
  },
  percival: {
    role: 'percival',
    loyalty: 'good',
    // 派西维尔看到 merlin 与 morgana 为 'mysteryWizard'（无法区分梅林/莫甘娜）
    visibility: { merlin: 'mysteryWizard', morgana: 'mysteryWizard' },
  },
  servant: {
    role: 'servant',
    loyalty: 'good',
    // 忠臣首夜看不到任何人
    visibility: {},
  },

  // Evil
  morgana: {
    role: 'morgana',
    loyalty: 'evil',
    // 邪恶方互相可见为 'evil'
    visibility: { morgana: 'evil', minion: 'evil' },
  },
  minion: {
    role: 'minion',
    loyalty: 'evil',
    visibility: { morgana: 'evil', minion: 'evil' },
  },

  // 以下角色 v0.1.6 暂未实现，占位以满足 Record<TRoles> 索引签名。
  // assignRoles 会在命中时抛出「暂不支持」，配置阶段即拒绝。
  merlinPure: { role: 'merlinPure', loyalty: 'good', visibility: {} },
  tristan: { role: 'tristan', loyalty: 'good', visibility: {} },
  isolde: { role: 'isolde', loyalty: 'good', visibility: {} },
  goodLancelot: { role: 'goodLancelot', loyalty: 'good', visibility: {} },
  guinevere: { role: 'guinevere', loyalty: 'good', visibility: {} },
  troublemaker: { role: 'troublemaker', loyalty: 'good', visibility: {} },
  cleric: { role: 'cleric', loyalty: 'good', visibility: {} },
  oberon: { role: 'oberon', loyalty: 'evil', visibility: {} },
  mordred: { role: 'mordred', loyalty: 'evil', visibility: {} },
  evilLancelot: { role: 'evilLancelot', loyalty: 'evil', visibility: {} },
  trickster: { role: 'trickster', loyalty: 'evil', visibility: {} },
  lunatic: { role: 'lunatic', loyalty: 'evil', visibility: {} },
  brute: { role: 'brute', loyalty: 'evil', visibility: {} },
  witch: { role: 'witch', loyalty: 'evil', visibility: {} },
  revealer: { role: 'revealer', loyalty: 'evil', visibility: {} },
  wraith: { role: 'wraith', loyalty: 'evil', visibility: {} },
}

/** Roles actually playable in v0.1.6. Configs referencing others are rejected. */
export const SUPPORTED_ROLES: ReadonlySet<TRoles> = new Set<TRoles>([
  'merlin',
  'percival',
  'servant',
  'morgana',
  'minion',
])
