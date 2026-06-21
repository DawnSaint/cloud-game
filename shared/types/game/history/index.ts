export type { HistoryBase, HiddenHistory, IAction, IActionWithResult, THistoryType, THistoryStage } from './base';
export type { Vote, AnonymousVoteResult, PreVote, HistoryVoteBase, AnonymousHistoryVote, HistoryVote, THistoryVote } from './vote';
export type { HistoryMissionBase, HistoryMission, HistoryMissionHidden, THistoryMission, SwitchResult } from './mission';
export type { HistoryAssassinate } from './assassinate';

import type { HiddenHistory } from './base';
import type { AnonymousHistoryVote, HistoryVote } from './vote';
import type { HistoryMission, HistoryMissionHidden, SwitchResult } from './mission';
import type { HistoryAssassinate } from './assassinate';

export type THistoryResults =
  | AnonymousHistoryVote
  | HistoryVote
  | HistoryMission
  | HistoryMissionHidden
  | HistoryAssassinate
  | SwitchResult
  | HiddenHistory;
