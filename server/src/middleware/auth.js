const User = require('../models/User');

const auth = async (ctx, next) => {
  try {
    const userId = ctx.headers['x-user-id'];

    if (!userId) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error: 'Authentication required'
      };
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        error: 'Invalid user'
      };
      return;
    }

    ctx.state.user = user;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = {
      success: false,
      error: 'Authentication failed'
    };
  }
};

module.exports = auth;
