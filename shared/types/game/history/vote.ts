import type { HistoryBase } from './base';
import type { TeamMember, PreVoteData, TVoteOption } from '../vote';

export interface Vote {
  playerID: string;
  onMission: boolean;
  value: TVoteOption;
}

export interface AnonymousVoteResult {
  approve: number;
  reject: number;
}

export interface PreVote extends HistoryBase {
  type: 'preVote';
  votes: PreVoteData[];
}

export interface HistoryVoteBase extends HistoryBase {
  type: 'vote';
  anonymous: boolean;
  index: number;
  result: TVoteOption;
  leaderID: string;
  team: TeamMember[];
  forced: boolean;
  votes: AnonymousVoteResult | Vote[];
}

export interface AnonymousHistoryVote extends HistoryVoteBase {
  anonymous: true;
  votes: AnonymousVoteResult;
}

export interface HistoryVote extends HistoryVoteBase {
  anonymous: false;
  votes: Vote[];
}

export type THistoryVote = AnonymousHistoryVote | HistoryVote;
