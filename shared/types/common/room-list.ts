import type { TGameType, TGameConfig } from './game';
import type { GameResults } from '../games/avalon/state';

export interface TRoomInfo {
  gameType: TGameType;
  hostID: string;
  players: number;
  state: 'created' | 'started' | 'locked';
  uuid: string;
  config: TGameConfig;
  createAt: string;
  startAt?: string;
  result?: GameResults;
}

export type TRoomsList = TRoomInfo[];
