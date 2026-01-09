const Room = require('../models/Room');
const AvalonGame = require('../games/avalon/AvalonGame');
const logger = require('../utils/logger');

// 存储活跃的游戏实例
const activeGames = new Map();

const handleGameEvents = (io, socket) => {
  // 开始游戏
  socket.on('start_game', async (data) => {
    try {
      const { roomId, userId } = data;

      const room = await Room.findById(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // 验证是否是房主
      if (room.host.toString() !== userId) {
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }

      // 验证玩家数量
      if (room.players.length < 5 || room.players.length > 10) {
        socket.emit('error', { message: 'Need 5-10 players to start' });
        return;
      }

      // 创建游戏实例
      const game = new AvalonGame(room);
      const gameState = game.initializeGame();

      // 保存游戏状态到数据库
      room.status = 'playing';
      room.gameState = gameState;
      await room.save();

      // 缓存游戏实例
      activeGames.set(roomId, game);

      // 给每个玩家发送私有信息（角色和视野）
      room.players.forEach((player) => {
        const playerInfo = game.getPlayerInfo(player.userId.toString());
        const playerSocket = io.sockets.sockets.get(player.socketId);

        if (playerSocket) {
          playerSocket.emit('role_assigned', playerInfo);
        }
      });

      // 广播游戏开始和公开状态
      io.to(roomId).emit('game_started', {
        publicState: game.getPublicState()
      });

      logger.info(`Game started in room ${roomId}`);
    } catch (error) {
      logger.error(`Start game error: ${error.message}`);
      socket.emit('error', { message: error.message || 'Failed to start game' });
    }
  });

  // 队长提议组队
  socket.on('propose_team', async (data) => {
    try {
      const { roomId, userId, teamUserIds } = data;

      const game = activeGames.get(roomId);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const result = game.proposeTeam(userId, teamUserIds);

      // 保存状态
      const room = await Room.findById(roomId);
      room.gameState = game.state;
      await room.save();

      // 广播提议
      io.to(roomId).emit('team_proposed', {
        leader: userId,
        team: teamUserIds.map(uid => {
          const player = game.state.roles.find(r => r.userId === uid);
          return { userId: uid, username: player.username };
        }),
        publicState: game.getPublicState()
      });

      logger.info(`Team proposed in room ${roomId}`);
    } catch (error) {
      logger.error(`Propose team error: ${error.message}`);
      socket.emit('error', { message: error.message || 'Failed to propose team' });
    }
  });

  // 投票队伍提议
  socket.on('vote_team', async (data) => {
    try {
      const { roomId, userId, approve } = data;

      const game = activeGames.get(roomId);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const result = game.voteForTeam(userId, approve);

      // 保存状态
      const room = await Room.findById(roomId);
      room.gameState = game.state;
      await room.save();

      // 如果所有人都投票了，广播结果
      if (result.approved !== undefined) {
        io.to(roomId).emit('team_vote_result', {
          ...result,
          publicState: game.getPublicState()
        });

        if (result.gameOver) {
          io.to(roomId).emit('game_over', game.getGameResult());
          activeGames.delete(roomId);
        }
      } else {
        // 通知投票进度
        io.to(roomId).emit('vote_progress', result);
      }

      logger.info(`Team vote in room ${roomId}`);
    } catch (error) {
      logger.error(`Vote team error: ${error.message}`);
      socket.emit('error', { message: error.message || 'Failed to vote' });
    }
  });

  // 任务投票
  socket.on('vote_mission', async (data) => {
    try {
      const { roomId, userId, success } = data;

      const game = activeGames.get(roomId);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const result = game.voteForMission(userId, success);

      // 保存状态
      const room = await Room.findById(roomId);
      room.gameState = game.state;
      await room.save();

      // 如果所有队员都投票了，广播结果
      if (result.missionResult) {
        io.to(roomId).emit('mission_result', {
          ...result,
          publicState: game.getPublicState()
        });

        if (result.gameOver) {
          io.to(roomId).emit('game_over', game.getGameResult());
          activeGames.delete(roomId);
        }
      } else {
        // 通知投票进度
        io.to(roomId).emit('vote_progress', result);
      }

      logger.info(`Mission vote in room ${roomId}`);
    } catch (error) {
      logger.error(`Vote mission error: ${error.message}`);
      socket.emit('error', { message: error.message || 'Failed to vote for mission' });
    }
  });

  // 刺客刺杀
  socket.on('assassinate', async (data) => {
    try {
      const { roomId, userId, targetUserId } = data;

      const game = activeGames.get(roomId);

      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const result = game.assassinate(userId, targetUserId);

      // 保存状态
      const room = await Room.findById(roomId);
      room.gameState = game.state;
      room.status = 'finished';
      await room.save();

      // 广播刺杀结果
      io.to(roomId).emit('assassinate_result', result);

      // 广播游戏结束
      io.to(roomId).emit('game_over', game.getGameResult());

      // 清理游戏实例
      activeGames.delete(roomId);

      logger.info(`Assassination in room ${roomId}, winner: ${result.winner}`);
    } catch (error) {
      logger.error(`Assassinate error: ${error.message}`);
      socket.emit('error', { message: error.message || 'Failed to assassinate' });
    }
  });

  // 获取游戏状态
  socket.on('get_game_state', async (data) => {
    try {
      const { roomId, userId } = data;

      const game = activeGames.get(roomId);

      if (!game) {
        // 尝试从数据库恢复
        const room = await Room.findById(roomId);

        if (room && room.gameState) {
          const restoredGame = new AvalonGame(room);
          restoredGame.state = room.gameState;
          activeGames.set(roomId, restoredGame);

          const playerInfo = restoredGame.getPlayerInfo(userId);
          socket.emit('game_state', {
            publicState: restoredGame.getPublicState(),
            playerInfo
          });

          return;
        }

        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const playerInfo = game.getPlayerInfo(userId);

      socket.emit('game_state', {
        publicState: game.getPublicState(),
        playerInfo
      });
    } catch (error) {
      logger.error(`Get game state error: ${error.message}`);
      socket.emit('error', { message: 'Failed to get game state' });
    }
  });
};

module.exports = handleGameEvents;
