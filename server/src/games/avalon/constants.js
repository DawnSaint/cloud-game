// 游戏常量

const ROLES = {
  MERLIN: 'merlin',
  PERCIVAL: 'percival',
  LOYAL_SERVANT: 'loyal_servant',
  MORGANA: 'morgana',
  ASSASSIN: 'assassin',
  MORDRED: 'mordred',
  OBERON: 'oberon',
  MINION: 'minion'
};

const TEAMS = {
  GOOD: 'good',
  EVIL: 'evil'
};

const PHASES = {
  TEAM_PROPOSAL: 'team_proposal',
  TEAM_VOTE: 'team_vote',
  MISSION_VOTE: 'mission_vote',
  ASSASSINATE: 'assassinate',
  GAME_OVER: 'game_over'
};

const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

// 任务队伍人数配置 [玩家总数][任务轮次]
const MISSION_TEAM_SIZE = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5]
};

// 任务需要几张失败票才算失败
const MISSION_FAIL_VOTES = {
  5: [1, 1, 1, 1, 1],
  6: [1, 1, 1, 1, 1],
  7: [1, 1, 1, 2, 1],  // 第4轮需要2张失败票
  8: [1, 1, 1, 2, 1],
  9: [1, 1, 1, 2, 1],
  10: [1, 1, 1, 2, 1]
};

module.exports = {
  ROLES,
  TEAMS,
  PHASES,
  GAME_STATUS,
  MISSION_TEAM_SIZE,
  MISSION_FAIL_VOTES
};
