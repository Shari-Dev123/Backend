const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const Chat = require('../models/Chat');

// GET chat history between two users
router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await Chat.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    }).sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST send message
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const chat = await Chat.create({
      sender: req.user.id,
      receiver: receiverId,
      message
    });

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('new-message', chat);
    }

    res.status(201).json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;