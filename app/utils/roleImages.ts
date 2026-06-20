/**
 * 角色图片映射
 * 所有图片路径相对于 static 目录
 */

export type RoleImageKey =
  | 'brute'
  | 'cleric'
  | 'evil_lancelot'
  | 'good_lancelot'
  | 'guinevere'
  | 'isolde'
  | 'lunatic'
  | 'merlin_pure'
  | 'merlin'
  | 'minion'
  | 'mordred'
  | 'morgana'
  | 'mystery'
  | 'oberon'
  | 'percival'
  | 'revealer_hidden'
  | 'revealer_progress'
  | 'revealer'
  | 'servant'
  | 'trickster'
  | 'tristan'
  | 'troublemaker'
  | 'unknown_lancelot'
  | 'witch'
  | 'wraith';

/**
 * 角色图片路径映射表
 */
export const roleImages: Record<RoleImageKey, string> = {
  brute: '/static/images/roles/brute.webp',
  cleric: '/static/images/roles/cleric.webp',
  evil_lancelot: '/static/images/roles/evil_lancelot.webp',
  good_lancelot: '/static/images/roles/good_lancelot.webp',
  guinevere: '/static/images/roles/guinevere.webp',
  isolde: '/static/images/roles/isolde.webp',
  lunatic: '/static/images/roles/lunatic.webp',
  merlin_pure: '/static/images/roles/merlin_pure.webp',
  merlin: '/static/images/roles/merlin.webp',
  minion: '/static/images/roles/minion.webp',
  mordred: '/static/images/roles/mordred.webp',
  morgana: '/static/images/roles/morgana.webp',
  mystery: '/static/images/roles/mystery.webp',
  oberon: '/static/images/roles/oberon.webp',
  percival: '/static/images/roles/percival.webp',
  revealer_hidden: '/static/images/roles/revealer_hidden.webp',
  revealer_progress: '/static/images/roles/revealer_progress.webp',
  revealer: '/static/images/roles/revealer.webp',
  servant: '/static/images/roles/servant.webp',
  trickster: '/static/images/roles/trickster.webp',
  tristan: '/static/images/roles/tristan.webp',
  troublemaker: '/static/images/roles/troublemaker.webp',
  unknown_lancelot: '/static/images/roles/unknown_lancelot.webp',
  witch: '/static/images/roles/witch.webp',
  wraith: '/static/images/roles/wraith.webp',
};

/**
 * 获取角色图片路径
 * @param role 角色名称
 * @returns 图片路径
 */
export function getRoleImage(role: string): string {
  return `https://storage.yandexcloud.net/avalon-game/images/roles/anime/${role}.webp`;
}

export function getImage(path: string): string {
  return `https://storage.yandexcloud.net/avalon-game/images/${path}`;
}

/**
 * 角色名称到中文名称的映射
 */
export const roleNames: Record<RoleImageKey, string> = {
  brute: '野蛮人',
  cleric: '牧师',
  evil_lancelot: '邪恶兰斯洛特',
  good_lancelot: '善良兰斯洛特',
  guinevere: '格温妮维尔',
  isolde: '伊索尔德',
  lunatic: '疯子',
  merlin_pure: '纯净梅林',
  merlin: '梅林',
  minion: '爪牙',
  mordred: '莫德雷德',
  morgana: '莫甘娜',
  mystery: '未知',
  oberon: '奥伯伦',
  percival: '派西维尔',
  revealer_hidden: '隐藏揭示者',
  revealer_progress: '进展揭示者',
  revealer: '揭示者',
  servant: '忠臣',
  trickster: '骗子',
  tristan: '特里斯坦',
  troublemaker: '麻烦制造者',
  unknown_lancelot: '未知兰斯洛特',
  witch: '女巫',
  wraith: '幽灵',
};

/**
 * 获取角色中文名称
 * @param role 角色名称
 * @returns 中文名称
 */
export function getRoleName(role: RoleImageKey): string {
  return roleNames[role] || '未知角色';
}
