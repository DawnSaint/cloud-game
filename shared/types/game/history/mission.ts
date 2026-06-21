import type { HistoryBase } from './base';
import type { IAction, IActionWithResult } from './base';
import type { TMissionResult, MissionSettings } from '../mission';

export interface HistoryMissionBase extends HistoryBase {
  type: 'mission';
  hidden: boolean;
  index: number;
  settings: MissionSettings;
  leaderID?: string;
  actions: IAction[] | IActionWithResult[];
  result?: TMissionResult;
  fails?: number;
}

export interface HistoryMission extends HistoryMissionBase {
  hidden: false;
  result: TMissionResult;
  fails: number;
}

export interface HistoryMissionHidden extends HistoryMissionBase {
  hidden: true;
  result: undefined;
  fails: undefined;
}

export type THistoryMission = HistoryMissionHidden | HistoryMission;

export interface SwitchResult extends HistoryBase {
  type: 'switchResult';
  switcherID: string;
  targetID?: string;
  result?: TMissionResult;
}
