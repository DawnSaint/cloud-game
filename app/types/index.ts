import type { VisualGameState, GameResults } from '~~/_reference/packages/types/game/state';
import type { Player } from '~~/_reference/packages/types/game/player';
import type { MissionWithResult, TMissionResult } from '~~/_reference/packages/types/game/mission';
import type { TVoteOption } from '~~/_reference/packages/types/game/vote';
import type { TAssassinateType } from '~~/_reference/packages/types/game/addons/assassin';

export type { VisualGameState, GameResults, Player, MissionWithResult, TMissionResult, TVoteOption, TAssassinateType };

// 基础类型定义
export interface Dictionary<T> {
  [key: string]: T;
}

// 用户相关类型
export interface UserWithToken {
  id: string;
  name: string;
  login: string;
  email?: string;
  avatar?: string;
  token: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  avatar?: string;
}

// 房间相关类型
export interface RoomInfo {
  uuid: string;
  hostID: string;
  players: number;
  state: 'created' | 'started' | 'finished';
  options: GameOptions;
  result?: {
    winner: 'good' | 'evil';
  };
}

export interface GameOptions {
  roles: GameOptionsRoles;
  addons: GameOptionsAddons;
  features?: {
    lookingForPlayers?: boolean;
  };
}

export interface GameOptionsRoles {
  merlin?: boolean;
  percival?: boolean;
  morgana?: boolean;
  mordred?: boolean;
  oberon?: boolean;
  lancelots?: boolean;
  lovers?: boolean;
  troublemaker?: boolean;
  trickster?: boolean;
  witch?: boolean;
  brute?: boolean;
  lunatic?: boolean;
  guinevere?: boolean;
  merlin_pure?: boolean;
  cleric?: boolean;
  revealer?: boolean;
}

export interface GameOptionsAddons {
  lady_of_lake?: boolean;
  lady_of_sea?: boolean;
  plot_cards?: boolean;
  excalibur?: boolean;
}

export type TRoomsList = RoomInfo[];

// 房间玩家
export interface RoomPlayer {
  id: string;
  isLeader: boolean;
}

// 聊天消息
export interface ChatMessage {
  userID: string;
  message: string;
  timestamp: number;
}

// 房间投票
export interface VoteOfPlayer extends RoomPlayer {
  voteResult?: boolean;
}

export interface VoteRoomResult {
  total: number;
  yes: number;
  no: number;
  required: number;
}

export type TVoteTarget = 'endGame' | 'endAndRestartGame';

export interface VoteInRoom {
  target: TVoteTarget;
  votes: VoteOfPlayer[];
  result: VoteRoomResult;
}

// 房间状态基类
export interface BaseRoomState {
  stage: 'created' | 'locked' | 'started';
  roomID: string;
  leaderID: string;
  createAt: string;
  players: RoomPlayer[];
  vote?: VoteInRoom;
  options: GameOptions;
  chat: ChatMessage[];
}

// 创建状态的房间
export interface CreatedRoomState extends BaseRoomState {
  stage: 'created';
}

// 锁定状态的房间
export interface LockedRoomState extends BaseRoomState {
  stage: 'locked';
}

// 游戏中的房间
export interface StartedRoomState extends BaseRoomState {
  stage: 'started';
  startAt: string;
  game: VisualGameState;
}

export type TRoomState = CreatedRoomState | LockedRoomState | StartedRoomState;

// Socket 错误响应
export interface ISocketError {
  error: string;
}

// 语言类型
export type TLanguage = 'en' | 'zh-cn' | 'zh-tw' | 'ru' | 'es' | 'pt';

// Store 状态类型
export interface IUserSettings {
  locale?: { value: TLanguage; isDefault: boolean };
  hideIndexInHistory?: boolean;
  colorTheme?: 'light' | 'dark';
  style?: 'default' | 'anime';
}

export type TUserState =
  | {
      status: 'loading';
    }
  | {
      status: 'ready';
      profile: PublicUserProfile;
    };

export type TAlertsName = 'discordchat';

export type TAlerts = {
  [key in TAlertsName]?: number;
};
