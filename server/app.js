require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const http = require('http');
const connectDB = require('./src/config/database');
const routes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const initializeSocket = require('./src/socket');
const logger = require('./src/utils/logger');

const app = new Koa();
const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 中间件
app.use(errorHandler);
app.use(cors());
app.use(bodyParser());

// 路由
app.use(routes.routes());
app.use(routes.allowedMethods());

// 健康检查
app.use(async (ctx) => {
  if (ctx.path === '/health') {
    ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
  }
});

// 创建 HTTP 服务器
const server = http.createServer(app.callback());

// 初始化 Socket.IO
const io = initializeSocket(server);

// 启动服务器
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🎮  Cloud Game Platform - Avalon                ║
║                                                   ║
║   Server: http://localhost:${PORT}                   ║
║   Health: http://localhost:${PORT}/health            ║
║                                                   ║
║   Ready to accept connections!                    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// 优雅关闭逻辑
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info('HTTP server closed');
    if (signal === 'SIGUSR2') {
      // nodemon 重启信号，发送给自己以完成重启
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon reload signal

module.exports = { app, server, io };
