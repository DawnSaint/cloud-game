import type { VisualGameState } from '../games/avalon/state';
import type { GameOptions } from '../games/avalon/options';
import type { TVoteOption } from '../games/avalon/vote';
import type { TMissionResult } from '../games/avalon/mission';
import type { TRoles } from '../games/avalon/roles';
import type { TAssassinateType } from '../games/avalon/addons';

export interface AvalonServerToClientEvents {
  gameUpdated: (state: VisualGameState) => void;
  restartGame: (uuid: string) => void;
}

export interface AvalonClientToServerEvents {
  updateOptions: (uuid: string, options: GameOptions) => void;
  shuffle: (uuid: string) => void;

  joinGame: (uuid: string) => void;
  startGame: (uuid: string) => void;
  leaveGame: (uuid: string) => void;
  restartGame: (uuid: string) => void;

  selectPlayer: (uuid: string, userID: string) => void;
  sentSelectedPlayers: (uuid: string) => void;
  voteForMission: (uuid: string, option: TVoteOption) => void;
  actionOnMission: (uuid: string, result: TMissionResult) => void;
  assassinate: (uuid: string, type: TAssassinateType, role?: TRoles) => void;
}
