const { ROLES, TEAMS } = require('./constants');

// 角色定义
const ROLE_DEFINITIONS = {
  [ROLES.MERLIN]: {
    name: '梅林',
    team: TEAMS.GOOD,
    description: '梅林知道所有邪恶方成员（莫德雷德除外），但不能让刺客发现自己的身份'
  },
  [ROLES.PERCIVAL]: {
    name: '派西维尔',
    team: TEAMS.GOOD,
    description: '派西维尔能看到梅林和莫甘娜，但不知道谁是谁'
  },
  [ROLES.LOYAL_SERVANT]: {
    name: '忠臣',
    team: TEAMS.GOOD,
    description: '普通的好人，没有特殊能力'
  },
  [ROLES.MORGANA]: {
    name: '莫甘娜',
    team: TEAMS.EVIL,
    description: '在派西维尔眼中伪装成梅林'
  },
  [ROLES.ASSASSIN]: {
    name: '刺客',
    team: TEAMS.EVIL,
    description: '游戏结束时如果好人获胜，刺客可以尝试刺杀梅林'
  },
  [ROLES.MORDRED]: {
    name: '莫德雷德',
    team: TEAMS.EVIL,
    description: '对梅林隐身，梅林看不到莫德雷德'
  },
  [ROLES.OBERON]: {
    name: '奥伯伦',
    team: TEAMS.EVIL,
    description: '对其他邪恶方隐身，也看不到其他邪恶方成员'
  },
  [ROLES.MINION]: {
    name: '爪牙',
    team: TEAMS.EVIL,
    description: '普通的坏人，没有特殊能力'
  }
};

// 根据玩家数量确定角色配置
const ROLE_CONFIGS = {
  5: [
    ROLES.MERLIN,
    ROLES.PERCIVAL,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.MORGANA,
    ROLES.ASSASSIN
  ],
  6: [
    ROLES.MERLIN,
    ROLES.PERCIVAL,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.MORGANA,
    ROLES.ASSASSIN
  ],
  7: [
    ROLES.MERLIN,
    ROLES.PERCIVAL,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.MORGANA,
    ROLES.ASSASSIN,
    ROLES.OBERON
  ],
  8: [
    ROLES.MERLIN,
    ROLES.PERCIVAL,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.MORGANA,
    ROLES.ASSASSIN,
    ROLES.MINION
  ],
  9: [
    ROLES.MERLIN,
    ROLES.PERCIVAL,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.MORGANA,
    ROLES.ASSASSIN,
    ROLES.MORDRED
  ],
  10: [
    ROLES.MERLIN,
    ROLES.PERCIVAL,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.LOYAL_SERVANT,
    ROLES.MORGANA,
    ROLES.ASSASSIN,
    ROLES.MORDRED,
    ROLES.OBERON
  ]
};

// 获取玩家的视野（能看到哪些玩家）
const getPlayerVision = (role, roles) => {
  const vision = [];

  switch (role) {
    case ROLES.MERLIN:
      // 梅林能看到所有邪恶方（莫德雷德除外）
      roles.forEach((r, idx) => {
        if (r.team === TEAMS.EVIL && r.role !== ROLES.MORDRED) {
          vision.push(idx);
        }
      });
      break;

    case ROLES.PERCIVAL:
      // 派西维尔能看到梅林和莫甘娜
      roles.forEach((r, idx) => {
        if (r.role === ROLES.MERLIN || r.role === ROLES.MORGANA) {
          vision.push(idx);
        }
      });
      break;

    case ROLES.MORGANA:
    case ROLES.ASSASSIN:
    case ROLES.MORDRED:
    case ROLES.MINION:
      // 普通邪恶方能看到其他邪恶方（奥伯伦除外）
      roles.forEach((r, idx) => {
        if (r.team === TEAMS.EVIL && r.role !== ROLES.OBERON) {
          vision.push(idx);
        }
      });
      break;

    case ROLES.OBERON:
      // 奥伯伦看不到任何人
      break;

    case ROLES.LOYAL_SERVANT:
      // 忠臣看不到任何人
      break;
  }

  return vision;
};

// 洗牌算法
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 分配角色
const assignRoles = (playerCount) => {
  const roleConfig = ROLE_CONFIGS[playerCount];
  if (!roleConfig) {
    throw new Error(`Invalid player count: ${playerCount}`);
  }

  const shuffledRoles = shuffleArray(roleConfig);

  return shuffledRoles.map(role => ({
    role,
    team: ROLE_DEFINITIONS[role].team
  }));
};

module.exports = {
  ROLE_DEFINITIONS,
  ROLE_CONFIGS,
  getPlayerVision,
  assignRoles
};
