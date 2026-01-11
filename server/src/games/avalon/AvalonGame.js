const { ROLES, TEAMS, PHASES, MISSION_TEAM_SIZE, MISSION_FAIL_VOTES } = require('./constants');
const { assignRoles, getPlayerVision, ROLE_DEFINITIONS } = require('./roles');

class AvalonGame {
  constructor(room) {
    this.room = room;
    this.playerCount = room.players.length;
    this.state = null;
  }

  // 初始化游戏
  initializeGame() {
    if (this.playerCount < 5 || this.playerCount > 10) {
      throw new Error('Player count must be between 5 and 10');
    }

    const assignedRoles = assignRoles(this.playerCount);

    this.state = {
      round: 1,
      phase: PHASES.TEAM_PROPOSAL,
      currentLeader: 0,
      proposalCount: 0,
      maxProposals: 5,
      roles: this.room.players.map((player, idx) => ({
        userId: player.userId.toString(),
        username: player.username,
        role: assignedRoles[idx].role,
        team: assignedRoles[idx].team
      })),
      missions: [],
      currentProposal: null,
      missionResults: [],
      winner: null,
      assassinTarget: null
    };

    return this.state;
  }

  // 获取玩家的私有信息（角色和视野）
  getPlayerInfo(userId) {
    const playerIndex = this.state.roles.findIndex(r => r.userId === userId);
    if (playerIndex === -1) {
      return null;
    }

    const player = this.state.roles[playerIndex];
    const vision = getPlayerVision(player.role, this.state.roles);

    // const visiblePlayers = vision.map(idx => ({
    //   username: this.state.roles[idx].username,
    //   userId: this.state.roles[idx].userId
    // }));

    const visiblePlayers = vision.map(idx => this.state.roles[idx].username);

    return {
      role: player.role,
      roleName: ROLE_DEFINITIONS[player.role].name,
      team: player.team,
      description: ROLE_DEFINITIONS[player.role].description,
      vision: visiblePlayers
    };
  }

  // 获取公开的游戏状态
  getPublicState() {
    return {
      round: this.state.round,
      phase: this.state.phase,
      currentLeader: {
        username: this.state.roles[this.state.currentLeader].username,
        userId: this.state.roles[this.state.currentLeader].userId
      },
      proposalCount: this.state.proposalCount,
      maxProposals: this.state.maxProposals,
      requiredTeamSize: MISSION_TEAM_SIZE[this.playerCount][this.state.round - 1],
      missionResults: this.state.missionResults,
      currentProposal: this.state.currentProposal,
      winner: this.state.winner,
      players: this.state.roles.map(r => ({
        username: r.username,
        userId: r.userId
      }))
    };
  }

  // 队长提议组队
  proposeTeam(userId, teamUserIds) {
    if (this.state.phase !== PHASES.TEAM_PROPOSAL) {
      throw new Error('Not in team proposal phase');
    }

    const currentLeader = this.state.roles[this.state.currentLeader];
    if (currentLeader.userId !== userId) {
      throw new Error('You are not the current leader');
    }

    const requiredSize = MISSION_TEAM_SIZE[this.playerCount][this.state.round - 1];
    if (teamUserIds.length !== requiredSize) {
      throw new Error(`Team size must be ${requiredSize}`);
    }

    // 验证所有队员都是有效玩家
    const validUserIds = this.state.roles.map(r => r.userId);
    for (const uid of teamUserIds) {
      if (!validUserIds.includes(uid)) {
        throw new Error('Invalid team member');
      }
    }

    this.state.currentProposal = {
      team: teamUserIds,
      votes: []
    };

    this.state.phase = PHASES.TEAM_VOTE;

    return this.getPublicState();
  }

  // 投票是否同意队伍
  voteForTeam(userId, approve) {
    if (this.state.phase !== PHASES.TEAM_VOTE) {
      throw new Error('Not in team vote phase');
    }

    if (this.state.currentProposal.votes.some(v => v.userId === userId)) {
      throw new Error('You have already voted');
    }

    this.state.currentProposal.votes.push({
      userId,
      approve: Boolean(approve)
    });

    // 检查是否所有人都投票了
    if (this.state.currentProposal.votes.length === this.playerCount) {
      return this.resolveTeamVote();
    }

    return { votesReceived: this.state.currentProposal.votes.length, totalPlayers: this.playerCount };
  }

  // 结算队伍投票
  resolveTeamVote() {
    const approveCount = this.state.currentProposal.votes.filter(v => v.approve).length;
    const approved = approveCount > this.playerCount / 2;

    const result = {
      approved,
      votes: this.state.currentProposal.votes,
      approveCount,
      rejectCount: this.playerCount - approveCount
    };

    if (approved) {
      this.state.phase = PHASES.MISSION_VOTE;
      return { ...result, nextPhase: PHASES.MISSION_VOTE };
    } else {
      this.state.proposalCount++;

      // 检查是否达到最大提议次数
      if (this.state.proposalCount >= this.state.maxProposals) {
        this.state.winner = TEAMS.EVIL;
        this.state.phase = PHASES.GAME_OVER;
        return { ...result, gameOver: true, winner: TEAMS.EVIL, reason: 'Max proposals reached' };
      }

      // 更换队长
      this.state.currentLeader = (this.state.currentLeader + 1) % this.playerCount;
      this.state.currentProposal = null;
      this.state.phase = PHASES.TEAM_PROPOSAL;

      return { ...result, nextPhase: PHASES.TEAM_PROPOSAL };
    }
  }

  // 任务投票（队伍成员执行任务）
  voteForMission(userId, success) {
    if (this.state.phase !== PHASES.MISSION_VOTE) {
      throw new Error('Not in mission vote phase');
    }

    // 验证玩家是否在队伍中
    if (!this.state.currentProposal.team.includes(userId)) {
      throw new Error('You are not in the mission team');
    }

    if (!this.state.currentProposal.missionVotes) {
      this.state.currentProposal.missionVotes = [];
    }

    if (this.state.currentProposal.missionVotes.some(v => v.userId === userId)) {
      throw new Error('You have already voted');
    }

    this.state.currentProposal.missionVotes.push({
      userId,
      success: Boolean(success)
    });

    // 检查队伍所有成员是否都投票了
    if (this.state.currentProposal.missionVotes.length === this.state.currentProposal.team.length) {
      return this.resolveMission();
    }

    return {
      votesReceived: this.state.currentProposal.missionVotes.length,
      totalTeamMembers: this.state.currentProposal.team.length
    };
  }

  // 结算任务
  resolveMission() {
    const failVotes = this.state.currentProposal.missionVotes.filter(v => !v.success).length;
    const requiredFails = MISSION_FAIL_VOTES[this.playerCount][this.state.round - 1];
    const missionSuccess = failVotes < requiredFails;

    const missionResult = {
      round: this.state.round,
      success: missionSuccess,
      failVotes,
      team: this.state.currentProposal.team.map(userId => {
        const player = this.state.roles.find(r => r.userId === userId);
        return { username: player.username, userId: player.userId };
      })
    };

    this.state.missionResults.push(missionResult);

    // 检查游戏是否结束
    const successCount = this.state.missionResults.filter(m => m.success).length;
    const failCount = this.state.missionResults.filter(m => !m.success).length;

    if (successCount >= 3) {
      // 好人赢了3轮任务，进入刺客阶段
      this.state.phase = PHASES.ASSASSINATE;
      return {
        missionResult,
        nextPhase: PHASES.ASSASSINATE,
        message: 'Good team wins 3 missions! Assassin must identify Merlin.'
      };
    } else if (failCount >= 3) {
      // 坏人赢了3轮任务
      this.state.winner = TEAMS.EVIL;
      this.state.phase = PHASES.GAME_OVER;
      return {
        missionResult,
        gameOver: true,
        winner: TEAMS.EVIL,
        message: 'Evil team wins!'
      };
    }

    // 继续下一轮
    this.state.round++;
    this.state.proposalCount = 0;
    this.state.currentLeader = (this.state.currentLeader + 1) % this.playerCount;
    this.state.currentProposal = null;
    this.state.phase = PHASES.TEAM_PROPOSAL;

    return {
      missionResult,
      nextPhase: PHASES.TEAM_PROPOSAL,
      nextRound: this.state.round
    };
  }

  // 刺客刺杀
  assassinate(userId, targetUserId) {
    if (this.state.phase !== PHASES.ASSASSINATE) {
      throw new Error('Not in assassinate phase');
    }

    // 验证是否是刺客
    const assassin = this.state.roles.find(r => r.role === ROLES.ASSASSIN);
    if (!assassin || assassin.userId !== userId) {
      throw new Error('You are not the assassin');
    }

    // 验证目标是否有效
    const target = this.state.roles.find(r => r.userId === targetUserId);
    if (!target) {
      throw new Error('Invalid target');
    }

    this.state.assassinTarget = targetUserId;

    // 检查是否刺中梅林
    const merlin = this.state.roles.find(r => r.role === ROLES.MERLIN);
    const assassinSuccess = merlin && merlin.userId === targetUserId;

    if (assassinSuccess) {
      this.state.winner = TEAMS.EVIL;
    } else {
      this.state.winner = TEAMS.GOOD;
    }

    this.state.phase = PHASES.GAME_OVER;

    return {
      assassinSuccess,
      target: { username: target.username, userId: target.userId },
      merlin: { username: merlin.username, userId: merlin.userId },
      winner: this.state.winner,
      gameOver: true
    };
  }

  // 获取游戏结果（包含所有角色信息）
  getGameResult() {
    if (this.state.phase !== PHASES.GAME_OVER) {
      return null;
    }

    return {
      winner: this.state.winner,
      roles: this.state.roles.map(r => ({
        username: r.username,
        userId: r.userId,
        role: r.role,
        roleName: ROLE_DEFINITIONS[r.role].name,
        team: r.team
      })),
      missionResults: this.state.missionResults,
      assassinTarget: this.state.assassinTarget
    };
  }
}

module.exports = AvalonGame;
