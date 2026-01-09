const Room = require('../models/Room');
const logger = require('../utils/logger');

const createRoom = async (ctx) => {
  try {
    const { name, maxPlayers = 10 } = ctx.request.body;
    const user = ctx.state.user;

    if (!name || name.trim().length < 1) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Room name is required'
      };
      return;
    }

    if (maxPlayers < 5 || maxPlayers > 10) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Max players must be between 5 and 10'
      };
      return;
    }

    const room = await Room.create({
      name: name.trim(),
      gameType: 'avalon',
      host: user._id,
      maxPlayers,
      players: [{
        userId: user._id,
        username: user.username,
        isReady: false
      }]
    });

    logger.info(`Room created: ${room._id} by ${user.username}`);

    ctx.body = {
      success: true,
      data: room
    };
  } catch (error) {
    logger.error(`Create room error: ${error.message}`);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to create room'
    };
  }
};

const getRooms = async (ctx) => {
  try {
    const rooms = await Room.find({
      status: { $in: ['waiting', 'playing'] }
    })
      .select('-gameState')
      .sort({ createdAt: -1 })
      .limit(50);

    ctx.body = {
      success: true,
      data: rooms
    };
  } catch (error) {
    logger.error(`Get rooms error: ${error.message}`);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to get rooms'
    };
  }
};

const getRoom = async (ctx) => {
  try {
    const { id } = ctx.params;

    const room = await Room.findById(id);

    if (!room) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: 'Room not found'
      };
      return;
    }

    ctx.body = {
      success: true,
      data: room
    };
  } catch (error) {
    logger.error(`Get room error: ${error.message}`);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to get room'
    };
  }
};

const joinRoom = async (ctx) => {
  try {
    const { roomId } = ctx.request.body;
    const user = ctx.state.user;

    const room = await Room.findById(roomId);

    if (!room) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        error: 'Room not found'
      };
      return;
    }

    if (room.status !== 'waiting') {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Game has already started or finished'
      };
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Room is full'
      };
      return;
    }

    const existingPlayer = room.players.find(p => p.userId.toString() === user._id.toString());
    if (existingPlayer) {
      ctx.body = {
        success: true,
        data: room,
        message: 'Already in room'
      };
      return;
    }

    room.players.push({
      userId: user._id,
      username: user.username,
      isReady: false
    });

    await room.save();

    logger.info(`Player ${user.username} joined room ${room._id}`);

    ctx.body = {
      success: true,
      data: room
    };
  } catch (error) {
    logger.error(`Join room error: ${error.message}`);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Failed to join room'
    };
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  joinRoom
};
