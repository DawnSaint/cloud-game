export type TMissionResult = 'success' | 'fail';

export interface MissionSettings {
  players: number;
  failsRequired: number;
}

export interface MissionWithResult extends MissionSettings {
  hidden?: boolean;
  result?: TMissionResult;
  fails?: number;
}
