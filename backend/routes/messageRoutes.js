const express = require('express')
const { protect } = require('../middleware/authMiddleWare')
const { sendMessage } = require('../controllers/messageControlers')

const router = express.Router()

router.route('/').post(protect, sendMessage)
// router.route('/:chatId').get(protect, allMessages)

module.exports = router