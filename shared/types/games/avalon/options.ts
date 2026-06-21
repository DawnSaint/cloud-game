import type { TOptionalRoles } from './roles';

export interface GameOptionsRoles {
  merlin?: number;
  percival?: number;
  merlinPure?: number;
  tristan?: number;
  isolde?: number;
  goodLancelot?: number;
  guinevere?: number;
  troublemaker?: number;
  cleric?: number;
  morgana?: number;
  oberon?: number;
  wraith?: number;
  mordred?: number;
  evilLancelot?: number;
  trickster?: number;
  lunatic?: number;
  brute?: number;
  witch?: number;
  revealer?: number;
}

export interface AvalonGameConfig {
  roles: GameOptionsRoles;
}

export type GameOptions = AvalonGameConfig;
