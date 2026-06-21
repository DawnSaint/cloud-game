import type { Player } from './player';
import type { MissionWithResult } from './mission';
import type { GameSettingsWithRoles } from './settings';
import type { THistoryResults } from './history';
import type { TLoyalty } from './roles';
import type { Dictionary } from '../../utils';

export interface GameResults {
  winner?: TLoyalty;
  reason: TGameEndReasons;
}

export interface AvalonGameState {
  result?: GameResults;
  uuid: string;
  stage: TGameStage;
  vote: number;
  mission: number;
  missionState: MissionWithResult[];
  settings: GameSettingsWithRoles;
  history: THistoryResults[];
  players: Player[];
  debug?: Dictionary<unknown>;
}

export type VisualGameState = AvalonGameState;

export type TGameStage =
  | 'initialization'
  | 'selectTeam'
  | 'votingForTeam'
  | 'hidden'
  | 'onMission'
  | 'end'
  | 'assassinate';

export type TGameEndReasons =
  | 'manualy'
  | 'evilTeamMissions'
  | 'goodTeamMissions'
  | 'missMerlin'
  | 'killMerlin'
  | 'rejectedVote';
