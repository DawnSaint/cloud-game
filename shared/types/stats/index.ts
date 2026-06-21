import type { TOptionalRoles } from '../game/roles';

export type TTotalWinrateStats = {
  total: TWinrateStats;
  byPlayers: (TWinrateStats & { playerCount: number })[];
  roleStats: TRoleStats[];
};

export type TWinrateStats = {
  gamesCount: number;
  goodWins: number;
  evilWins: number;
  goodWinPercentage: number;
  evilWinPercentage: number;
};

export type TRoleStats = {
  role: TOptionalRoles;
} & TWinrateStats;
