export type { Dictionary } from './utils';
export { evilRolesImportance, goodRolesImportance } from './consts';

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
} from './game/roles';

export type { Player, PlayerFeatures } from './game/player';
export type { TMissionResult, MissionSettings, MissionWithResult } from './game/mission';
export type { TVoteOption, TeamMember, PreVoteData } from './game/vote';
export type { GameOptionsRoles, GameOptions } from './game/options';
export type { PlayersSettings, GameRoles, GameSettings, GameSettingsWithRoles } from './game/settings';
export type { VisualGameState, GameResults, TGameStage, TGameEndReasons } from './game/state';
export type { TAssassinateType, TAssassinateResult, AssassinAddonData, AssassinateProgressData } from './game/addons';

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
} from './game/history';

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
} from './room';
export type { TRoomsList, TRoomInfo } from './room/list';

export type { PublicUserProfile, UserForUI, UserWithToken, UserProfile } from './user';
export type { IAvatarInfo } from './user/avatars';

export type { TTotalWinrateStats, TWinrateStats, TRoleStats } from './stats';

export type {
  ServerToClientEvents,
  ClientToServerEvents,
  Server,
  Socket,
  ServerSocket,
  ISocketError,
  IRoomUnavailableError,
  ILoginError,
  IRegisterError,
  IUpdateEmailError,
  IUpdatePasswordError,
  IUpdateLoginError,
  IUpdateAvatarError,
  ArgumentOfCallback,
} from './api/socket-events';
