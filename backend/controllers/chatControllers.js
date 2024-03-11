const asyncHandler = require('express-async-handler');
const Chat = require('../models/chatModel');
const User = require('../models/userModel');

const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("UserId params not sent with request");
        return res.status(400).send("UserId params not sent with request");
    }

    try {
        // Check if a chat exists between the current user and the specified user
        const isChat = await Chat.findOne({
            isGroupChat: false,
            users: { $all: [req.user._id, userId] } // Using $all to match both user IDs
        })
            .populate("users", "-password")
            .populate("latestMessage.sender", "name pic email");

        if (isChat) {
            // If the chat exists, send it in the response
            res.send(isChat);
        } else {
            // If the chat doesn't exist, create a new chat
            const chatData = {
                chatName: 'sender',
                isGroupChat: false,
                users: [req.user._id, userId],
            };

            const createdChat = await Chat.create(chatData);

            // Populate the users field of the created chat
            const fullChat = await Chat.findOne({ _id: createdChat._id })
                .populate("users", "-password");

            res.status(200).send(fullChat);
        }
    } catch (error) {
        console.error("Error accessing chat:", error);
        res.status(500).send("Internal Server Error");
    }
});

const fetchChats = asyncHandler(async (req, res) => {
    try {
        const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({updatedAt: -1})
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name pic email"
                })
                res.status(200).send(results);
            })
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(400).send("Internal Server Error");
        throw new Error(error.message)
    }
});

const createGroupChat = asyncHandler(async(req, res) => {
    if(!req.body.users || !req.body.name){
        return res.status(400).send({
            message:"Please Fill all the fields"
        })
    }
    var users = JSON.parse(req.body.users)

    if(users.length < 2){
        return res.status(400).send("More than 2 users are required to form a group chat !")
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user,
        })

        const fullGroupChat = await Chat.findOne({_id: groupChat._id})
        .populate("users", "-password")
        .populate("groupAdmin", "-password")

        res.status(200).json(fullGroupChat)
    } catch (error) {
        res.status(400)
        throw new Error
    }
})

const renameGroup = asyncHandler(async(req, res) => {
    const {chatId, chatName} = req.body;

    const upadtedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
            chatName: chatName,
        },
        {
            new: true,
        }
    )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

    if(!upadtedChat){
        res.status(404);
        throw new Error
    }else{
        res.json(upadtedChat)
    }
})

const addToGroup = asyncHandler(async(req, res) => {
    const {chatId, userId} = req.body;

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: {users: userId},
        },
        {
            new: true
        }
    ).populate("users", "-password")
    .populate("groupAdmin", "-password")

    if(!added){
        res.status(400)
        throw new Error('Chat Not Found')
    }else{
        res.send(added)
    }

})


const removeFromGroup = asyncHandler(async(req, res) => {
    const {chatId, userId} = req.body;

    const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: {users: userId},
        },
        {
            new: true
        }
    ).populate("users", "-password")
    .populate("groupAdmin", "-password")

    if(!removed){
        res.status(400)
        throw new Error('Chat Not Found')
    }else{
        res.send(removed)
    }

})
module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup };
