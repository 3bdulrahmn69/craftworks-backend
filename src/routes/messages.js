const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const messageController = require('../controllers/messageController');

router.post('/', auth, messageController.createMessage);
router.get('/', auth, messageController.listMessages);
router.get('/:id', auth, messageController.getMessage);
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router; 