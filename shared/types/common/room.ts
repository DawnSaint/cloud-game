import type { TGameType, TGameConfig } from './game';
import type { VisualGameState } from '../games/avalon/state';

export interface RoomPlayer {
  id: string;
  isLeader: boolean;
}

export type TVoteTarget = 'endGame' | 'endAndRestartGame';

export interface VoteRoomResult {
  total: number;
  yes: number;
  no: number;
  required: number;
}

export interface VoteInRoom {
  target: TVoteTarget;
  votes: VoteOfPlayer[];
  result: VoteRoomResult;
}

export interface VoteOfPlayer extends RoomPlayer {
  voteResult?: boolean;
}

export interface BaseRoomState {
  gameType: TGameType;
  stage: 'created' | 'locked' | 'started';
  roomID: string;
  leaderID: string;
  createAt: string;
  players: RoomPlayer[];
  vote?: VoteInRoom;
  config: TGameConfig;
}

export interface CreatedRoomState extends BaseRoomState {
  stage: 'created';
}

export interface LockedRoomState extends BaseRoomState {
  stage: 'locked';
}

export interface StartedRoomState extends BaseRoomState {
  stage: 'started';
  startAt: string;
  game: VisualGameState;
}

export type TRoomState = CreatedRoomState | LockedRoomState | StartedRoomState;
