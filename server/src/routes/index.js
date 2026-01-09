const Router = require('koa-router');
const authRouter = require('./auth');
const roomRouter = require('./room');

const router = new Router();

router.use('/api/auth', authRouter.routes(), authRouter.allowedMethods());
router.use('/api/room', roomRouter.routes(), roomRouter.allowedMethods());

module.exports = router;
