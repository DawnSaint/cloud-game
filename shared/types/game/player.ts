import type { TVisibleRole } from './roles';
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
}
