const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  videoId: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: String,
    required: true,
    default: 'Anonymous'
  },
  userId: {
    type: String,
    required: true
  },
  isBot: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  likes: {
    type: Number,
    default: 0
  },
  parentMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
messageSchema.index({ videoId: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);