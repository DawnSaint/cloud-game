import type { VisualGameState } from '../game/state';
import type { GameOptions } from '../game/options';

export type TRoomState = CreatedRoomState | LockedRoomState | StartedRoomState;

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

export interface BaseRoomState {
  stage: 'created' | 'locked' | 'started';
  roomID: string;
  leaderID: string;
  createAt: string;
  players: RoomPlayer[];
  vote?: VoteInRoom;
  options: GameOptions;
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

export interface RoomPlayer {
  id: string;
  isLeader: boolean;
}

export interface VoteOfPlayer extends RoomPlayer {
  voteResult?: boolean;
}
