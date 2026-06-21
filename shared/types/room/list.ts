import type { GameOptions, GameResults } from '../game';

export type TRoomsList = TRoomInfo[];

export interface TRoomInfo {
  hostID: string;
  players: number;
  state: 'created' | 'started' | 'locked';
  uuid: string;
  options: GameOptions;
  createAt: string;
  startAt?: string;
  result?: GameResults;
}
