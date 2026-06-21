import type { HistoryBase } from './base';
import type { TAssassinateResult, TAssassinateType } from '../addons';

export interface HistoryAssassinate extends HistoryBase {
  type: 'assassinate';
  result: TAssassinateResult;
  assassinID: string;
  assassinateType: TAssassinateType;
  killedIDs: string[];
}
