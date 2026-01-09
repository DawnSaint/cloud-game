const User = require('../models/User');
const logger = require('../utils/logger');

const login = async (ctx) => {
  try {
    const { username } = ctx.request.body;

    if (!username || username.trim().length < 2) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: 'Username must be at least 2 characters'
      };
      return;
    }

    let user = await User.findOne({ username: username.trim() });

    if (!user) {
      user = await User.create({
        username: username.trim(),
        lastLoginAt: new Date()
      });
      logger.info(`New user created: ${username}`);
    } else {
      user.lastLoginAt = new Date();
      await user.save();
      logger.info(`User logged in: ${username}`);
    }

    ctx.body = {
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: 'Login failed'
    };
  }
};

module.exports = {
  login
};
