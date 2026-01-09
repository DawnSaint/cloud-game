const Router = require('koa-router');
const roomController = require('../controllers/roomController');
const auth = require('../middleware/auth');

const router = new Router();

router.post('/create', auth, roomController.createRoom);
router.get('/getRoomList', roomController.getRooms);
router.get('/:id', roomController.getRoom);
router.post('/join', auth, roomController.joinRoom);

module.exports = router;
