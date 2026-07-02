import type { Player } from './player';
import type { MissionWithResult } from './mission';
import type { GameSettingsWithRoles } from './settings';
import type { THistoryResults } from './history';
import type { TLoyalty } from './roles';
import type { TVoteOption } from './vote';
import type { TMissionResult } from './mission';
import type { Dictionary } from '../../utils';

export interface GameResults {
  winner?: TLoyalty;
  reason: TGameEndReasons;
}

/**
 * v0.1.7 round-state-machine runtime fields. These mutate every turn
 * (`currentTeam` / `currentVotes` / `currentActions`) and rotate across
 * missions (`leaderID`). The authoritative state keeps real player roles
 * on `players[].role`; per-player visual redaction happens via
 * `avalonEngine.getVisualState` using the first-night visibility map.
 */
export interface AvalonGameState {
  result?: GameResults;
  uuid: string;
  stage: TGameStage;
  /** Consecutive rejected votes within the current mission (resets on mission start). */
  vote: number;
  /** Current mission index (0..4). */
  mission: number;
  missionState: MissionWithResult[];
  settings: GameSettingsWithRoles;
  history: THistoryResults[];
  players: Player[];
  /** id of the player whose turn it is to pick / submit a team. */
  leaderID: string;
  /** ids of players selected for the current vote round; cleared each pick cycle. */
  currentTeam: string[];
  /** per-player vote in the current round (key: player id). */
  currentVotes: Record<string, TVoteOption>;
  /** per-player action in the current mission (key: player id). */
  currentActions: Record<string, TMissionResult>;
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
