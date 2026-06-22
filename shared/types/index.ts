// Game types — canonical source: shared/types/games/avalon/
export type {
  TRoles,
  TGoodRoles,
  TEvilRoles,
  TUnknownRoles,
  TGoodOptionalRoles,
  TGoodRequiredRoles,
  TEvilOptionalRoles,
  TEvilRequiredRoles,
  TOptionalRoles,
  TRequiredRoles,
  TLoyalty,
  TVisibleRole,
} from './games/avalon/roles';

export type { Player, PlayerFeatures } from './games/avalon/player';
export type { TMissionResult, MissionSettings, MissionWithResult } from './games/avalon/mission';
export type { TVoteOption, TeamMember, PreVoteData } from './games/avalon/vote';
export type { GameOptionsRoles, AvalonGameConfig, GameOptions } from './games/avalon/options';
export type { PlayersSettings, GameRoles, GameSettings, GameSettingsWithRoles } from './games/avalon/settings';
export type { AvalonGameState, VisualGameState, GameResults, TGameStage, TGameEndReasons } from './games/avalon/state';
export type { TAssassinateType, TAssassinateResult, AssassinAddonData, AssassinateProgressData } from './games/avalon/addons';

export type {
  THistoryResults,
  THistoryType,
  THistoryStage,
  HistoryBase,
  HiddenHistory,
  IAction,
  IActionWithResult,
  Vote,
  AnonymousVoteResult,
  PreVote,
  HistoryVoteBase,
  AnonymousHistoryVote,
  HistoryVote,
  THistoryVote,
  HistoryMissionBase,
  HistoryMission,
  HistoryMissionHidden,
  THistoryMission,
  SwitchResult,
  HistoryAssassinate,
} from './games/avalon/history';

// Common types — canonical source: shared/types/common/
export type { TGameType, TGameConfig } from './common/game';

export type {
  TRoomState,
  TVoteTarget,
  VoteRoomResult,
  VoteInRoom,
  BaseRoomState,
  CreatedRoomState,
  LockedRoomState,
  StartedRoomState,
  RoomPlayer,
  VoteOfPlayer,
} from './common/room';

export type { TRoomsList, TRoomInfo } from './common/room-list';

// User types
export type { PublicUserProfile, UserForUI, UserWithToken, UserProfile } from './user';
export type { IAvatarInfo } from './user/avatars';

// Stats types
export type { TTotalWinrateStats, TWinrateStats, TRoleStats } from './stats';

// API types
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  Server,
  Socket,
  ServerSocket,
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
  ArgumentOfCallback,
} from './api/socket-events';
