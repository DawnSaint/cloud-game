import type { TRoles } from '../roles';

export interface AssassinateProgressData {
  type: TAssassinateType;
  stage: number;
  possibleTargets?: TRoles[];
}

export type TAssassinateResult = 'miss' | 'hit';

export type TAssassinateType = 'merlin' | 'lovers' | 'guinevere' | 'cleric';

export interface AssassinAddonData {
  assassinateTargets: TAssassinateType[];
  progressData?: AssassinateProgressData;
}
