import type { MissionSettings } from './mission';
import type { TGoodRoles, TEvilRoles } from './roles';

export interface PlayersSettings {
  evil: number;
  good: number;
}

export interface GameRoles {
  evil: TEvilRoles[];
  good: TGoodRoles[];
}

export interface GameSettings {
  missions: MissionSettings[];
  players: PlayersSettings;
  total: number;
}

export interface GameSettingsWithRoles extends GameSettings {
  roles: GameRoles;
}
