// const asyncHandler = require('express-async-handler');
// const User = require('../models/userModel');
// const Chat = require('../models/chatModel');
// const Message = require('../models/messageModel');

// const sendMessage = asyncHandler(async (req, res) => {
//     const { content, chatId } = req.body;

//     if (!content || !chatId) {
//         console.log('Invalid data passed into request');
//         return res.sendStatus(400);
//     }

//     var newMessage = {
//         sender: req.user._id,
//         content,
//         chat: chatId
//     };

//     try {
//         var message = await Message.create(newMessage);

//         message = await message.populate('sender', 'name pic');
//         message = await message.populate('chat');
//         message = await User.populate(message, {
//             path: 'chat.users',
//             select: 'name pic email'
//         });

//         await Chat.findByIdAndUpdate(req.body.chatId, {
//             latestMessage: message
//         });

//         res.json(message);
//     } catch (error) {
//         // Log detailed error information
//         console.error('Error occurred in sendMessage:', error);

//         // Send error response
//         res.status(400).json({ error: error.message });
//     }
// });

// module.exports = { sendMessage };


const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Message = require('../models/messageModel');

const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        console.log('Invalid data passed into request');
        return res.sendStatus(400);
    }

    try {
        // Check if the chat exists and the user is a participant
        const chat = await Chat.findOne({ _id: chatId, users: req.user._id });
        if (!chat) {
            console.log('Chat not found or user is not a participant');
            return res.sendStatus(400);
        }

        // Create the message
        const newMessage = new Message({
            sender: req.user._id,
            content,
            chat: chatId
        });
        const message = await newMessage.save();

        // Update the latestMessage field in the chat
        chat.latestMessage = message;
        await chat.save();

        // Populate message with sender and chat details
        await message.populate('sender', 'name pic').execPopulate();
        await message.populate('chat').execPopulate();

        res.json(message);
    } catch (error) {
        console.error('Error occurred in sendMessage:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = { sendMessage };
