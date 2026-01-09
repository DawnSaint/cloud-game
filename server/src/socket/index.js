const { Server } = require('socket.io');
const handleRoomEvents = require('./roomHandler');
const handleGameEvents = require('./gameHandler');
const logger = require('../utils/logger');

const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // 注册房间事件处理器
    handleRoomEvents(io, socket);

    // 注册游戏事件处理器
    handleGameEvents(io, socket);

    // 断开连接
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // 错误处理
    socket.on('error', (error) => {
      logger.error(`Socket error: ${error.message}`);
    });
  });

  return io;
};

module.exports = initializeSocket;
