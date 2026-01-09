const Room = require('../models/Room');
const logger = require('../utils/logger');

const handleRoomEvents = (io, socket) => {
  // 加入房间
  socket.on('join_room', async (data) => {
    try {
      const { roomId, userId, username } = data;

      if (!roomId || !userId || !username) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      const room = await Room.findById(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.status !== 'waiting') {
        socket.emit('error', { message: 'Room is not available' });
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      // 检查玩家是否已经在房间中
      const existingPlayer = room.players.find(p => p.userId.toString() === userId);

      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
      } else {
        room.players.push({
          userId,
          username,
          socketId: socket.id,
          isReady: false
        });
      }

      await room.save();

      // 加入 Socket.IO 房间
      socket.join(roomId);

      // 通知客户端加入成功
      socket.emit('joined_room', {
        success: true,
        room: {
          id: room._id,
          name: room.name,
          players: room.players.map(p => ({
            userId: p.userId,
            username: p.username,
            isReady: p.isReady
          })),
          maxPlayers: room.maxPlayers,
          status: room.status
        }
      });

      // 广播房间更新
      io.to(roomId).emit('room_updated', room);

      logger.info(`User ${username} joined room ${roomId}`);
    } catch (error) {
      logger.error(`Join room error: ${error.message}`);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // 离开房间
  socket.on('leave_room', async (data) => {
    try {
      const { roomId, userId } = data;

      const room = await Room.findById(roomId);

      if (!room) {
        return;
      }

      // 移除玩家
      room.players = room.players.filter(p => p.userId.toString() !== userId);

      // 如果房间为空，删除房间
      if (room.players.length === 0) {
        await Room.findByIdAndDelete(roomId);
        logger.info(`Room ${roomId} deleted (empty)`);
        return;
      }

      // 如果房主离开，转移房主
      if (room.host.toString() === userId) {
        room.host = room.players[0].userId;
      }

      await room.save();
      socket.disconnect();

      // 广播房间更新
      io.to(roomId).emit('room_updated', room);

      logger.info(`User ${userId} left room ${roomId}`);
    } catch (error) {
      logger.error(`Leave room error: ${error.message}`);
    }
  });

  // 玩家准备/取消准备
  socket.on('toggle_ready', async (data) => {
    try {
      const { roomId, userId } = data;

      const room = await Room.findById(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const player = room.players.find(p => p.userId.toString() === userId);

      if (!player) {
        socket.emit('error', { message: 'Player not in room' });
        return;
      }

      player.isReady = !player.isReady;
      await room.save();

      // 广播房间更新
      io.to(roomId).emit('room_updated', room);

      logger.info(`User ${userId} toggled ready in room ${roomId}`);
    } catch (error) {
      logger.error(`Toggle ready error: ${error.message}`);
      socket.emit('error', { message: 'Failed to toggle ready' });
    }
  });
};

module.exports = handleRoomEvents;
