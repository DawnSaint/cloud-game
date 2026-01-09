const logger = require('../utils/logger');

const errorHandler = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      error: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    logger.error(`Error: ${err.message}`, {
      error: err,
      url: ctx.url,
      method: ctx.method,
      ip: ctx.ip
    });
  }
};

module.exports = errorHandler;
