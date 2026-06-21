import type { Server as SuperServer, Socket as SuperServerSocket } from 'socket.io';
import type { Socket as SuperSocket } from 'socket.io-client';

import type { TRoomState } from '../common/room';
import type { TRoomsList } from '../common/room-list';
import type {
  IRoomUnavailableError,
  ILoginError,
  IRegisterError,
  IUpdateEmailError,
  IUpdatePasswordError,
  IUpdateLoginError,
} from './errors';
import type { TTotalWinrateStats } from '../stats';
import type { PublicUserProfile, UserForUI, UserWithToken } from '../user';

export type {
  ISocketError,
  IRoomUnavailableError,
  ILoginError,
  IRegisterError,
  IUpdateEmailError,
  IUpdatePasswordError,
  IUpdateLoginError,
  IUpdateAvatarError,
} from './errors';

export type { ArgumentOfCallback } from './helpers';

export interface CommonServerToClientEvents {
  roomsListUpdated: (list: TRoomsList) => void;
  onlineCounterUpdated: (counter: number) => void;
  roomOnlineUpdated: (counter: number) => void;
  roomUpdated: (state: TRoomState) => void;
  destroyRoom: (uuid: string) => void;
  serverError: (error: string) => void;
  renewJWT: () => void;
}

export interface CommonClientToServerEvents {
  getTotalStats: (callback: (stats: TTotalWinrateStats) => void) => void;
  getPlayerGames: (uuid: string, callback: (games: unknown[]) => void) => void;
  getRoomsList: (callback: (list: TRoomsList) => void) => void;
  getOnlineCounter: (id: string, callback: (counter: number) => void) => void;
  getUserProfile: (id: string, callback: (user: PublicUserProfile) => void) => void;

  registerUser: (user: { id: string; login: string; password: string }, callback: (result: UserWithToken | IRegisterError) => void) => void;
  login: (loginOrEmail: string, password: string, callback: (result: UserWithToken | ILoginError) => void) => void;
  getMyProfile: (callback: (profile: UserForUI) => void) => void;
  updateUserName: (name: string) => void;
  updateUserEmail: (password: string, email: string, callback: (result: true | IUpdateEmailError) => void) => void;
  updateUserLogin: (password: string, login: string, callback: (result: true | IUpdateLoginError) => void) => void;
  updateUserPassword: (password: string, newPassword: string, callback: (result: true | IUpdatePasswordError) => void) => void;

  createRoom: (callback: (uuid: string) => void) => void;
  joinRoom: (uuid: string, callback: (state: TRoomState | IRoomUnavailableError) => void) => void;
  lockRoom: (uuid: string) => void;
  kickPlayer: (uuid: string, userID: string) => void;
  leaveRoom: (uuid: string) => void;

  endGame: (uuid: string) => void;
  endAndRestartGame: (uuid: string) => void;
  voteInRoom: (uuid: string, result: boolean) => void;
}

export type CommonServer = SuperServer<CommonClientToServerEvents, CommonServerToClientEvents>;
export type CommonSocket = SuperSocket<CommonServerToClientEvents, CommonClientToServerEvents>;
export type CommonServerSocket = SuperServerSocket<CommonClientToServerEvents, CommonServerToClientEvents>;
