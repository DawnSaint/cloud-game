import type { TVisibleRole, TLoyalty } from './roles';
import type { TMissionResult } from './mission';
import type { TVoteOption } from './vote';

export interface PlayerFeatures {
  isLeader?: boolean;
  isSelected?: boolean;
  isSent?: boolean;
  waitForAction?: boolean;
  preVote?: TVoteOption;
  openAction?: boolean;
  isAssassin?: boolean;
}

export interface Player {
  index: number;
  id: string;
  role: TVisibleRole;
  features: PlayerFeatures;
  validMissionsResult?: TMissionResult[];
  /** 玩家显示名称，由服务端在游戏创建时从用户资料填充；前端回退到 profile 解析。 */
  name?: string;
  /** 玩家忠诚度（good/evil），end 阶段揭示；游玩期间仅服务端权威状态持有。 */
  loyalty?: TLoyalty;
}
