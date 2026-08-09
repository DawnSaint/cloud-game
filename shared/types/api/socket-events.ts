import type { Server as SuperServer, Socket as SuperServerSocket } from 'socket.io';
import type { Socket as SuperSocket } from 'socket.io-client';

import type { CommonClientToServerEvents, CommonServerToClientEvents } from './common-events';
import type { AvalonClientToServerEvents, AvalonServerToClientEvents } from './avalon-events';
import type { AchievementClientToServerEvents, AchievementServerToClientEvents } from './achievement-events';

export type {
  ISocketError,
  IRoomUnavailableError,
  IRoomLockedError,
  IRoomAlreadyInError,
  IRoomNotInError,
  IRoomNotLeaderError,
  RoomError,
  ILoginError,
  IRegisterError,
  IUpdateEmailError,
  IUpdatePasswordError,
  IUpdateLoginError,
  IUpdateAvatarError,
} from './errors';

export type { ArgumentOfCallback } from './helpers';

export type {
  CommonServerToClientEvents,
  CommonClientToServerEvents,
  CommonServer,
  CommonSocket,
  CommonServerSocket,
} from './common-events';

export type {
  AvalonServerToClientEvents,
  AvalonClientToServerEvents,
} from './avalon-events';

export type {
  AchievementServerToClientEvents,
  AchievementClientToServerEvents,
} from './achievement-events';

export interface ServerToClientEvents extends CommonServerToClientEvents, AvalonServerToClientEvents, AchievementServerToClientEvents {}

export interface ClientToServerEvents extends CommonClientToServerEvents, AvalonClientToServerEvents, AchievementClientToServerEvents {}

export type Server = SuperServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = SuperSocket<ServerToClientEvents, ClientToServerEvents>;
export type ServerSocket = SuperServerSocket<ClientToServerEvents, ServerToClientEvents>;
