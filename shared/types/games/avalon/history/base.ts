import type { TMissionResult } from '../mission';

export type THistoryType =
  | 'mission'
  | 'vote'
  | 'assassinate'
  | 'switchResult';

export type THistoryStage = 'active' | 'inactive' | 'progress' | 'finished';

export interface HistoryBase {
  type: THistoryType | 'hidden';
}

export interface HiddenHistory extends HistoryBase {
  type: 'hidden';
}

export interface IAction {
  playerID: string;
  switchedBy?: string;
}

export interface IActionWithResult extends IAction {
  value: TMissionResult;
}
