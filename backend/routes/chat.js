const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get chat history for a video
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await Message.find({ videoId })
      .sort({ timestamp: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v');
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
});

// Get message statistics
router.get('/:videoId/stats', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const stats = await Message.aggregate([
      { $match: { videoId } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          userMessages: {
            $sum: { $cond: [{ $eq: ['$isBot', false] }, 1, 0] }
          },
          botMessages: {
            $sum: { $cond: [{ $eq: ['$isBot', true] }, 1, 0] }
          },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          totalMessages: 1,
          userMessages: 1,
          botMessages: 1,
          uniqueUsersCount: { $size: '$uniqueUsers' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats[0] || {
        totalMessages: 0,
        userMessages: 0,
        botMessages: 0,
        uniqueUsersCount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chat stats'
    });
  }
});

// Like a message
router.post('/message/:messageId/like', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    message.likes += 1;
    await message.save();
    
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error liking message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while liking message'
    });
  }
});

module.exports = router;