const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "*", // Allow all origins for testing
  credentials: true
}));
app.use(express.json());

// Simple in-memory user storage for testing
const users = new Map();

// Store active rooms and users
const activeRooms = new Map();
const connectedUsers = new Map();
const chatMessages = new Map();

// Simple Chatbot
class ChatBot {
  constructor() {
    this.responses = {
      greetings: [
        "Hello! 👋 How are you enjoying this video?",
        "Hi there! Ready to learn something new today?",
        "Hey! Great to have you in the chat!",
        "Welcome! Feel free to ask any questions about the video."
      ],
      questions: [
        "That's a great question! What specific aspect are you curious about?",
        "I'd love to help with that! Could you provide more details?",
        "Interesting question! Let me think about the best way to explain this...",
      ],
      fallback: [
        "Thanks for sharing your thoughts!",
        "That's an interesting perspective!",
        "I appreciate you being part of this discussion!",
      ]
    };
  }

  generateResponse(userMessage) {
    console.log('🤖 Generating response for:', userMessage);
    
    const message = userMessage.toLowerCase().trim();
    
    if (message.match(/\b(hi|hello|hey)\b/)) {
      return this.getRandomResponse(this.responses.greetings);
    }
    
    if (message.includes('?')) {
      return this.getRandomResponse(this.responses.questions);
    }
    
    return this.getRandomResponse(this.responses.fallback);
  }

  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

const chatbot = new ChatBot();

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    users: users.size,
    message: 'Server is healthy!'
  });
});

// Test chatbot endpoint
app.post('/api/test-chatbot', (req, res) => {
  const { message } = req.body;
  console.log('🤖 Testing chatbot with message:', message);
  
  try {
    const response = chatbot.generateResponse(message);
    console.log('🤖 Chatbot response:', response);
    
    res.json({
      success: true,
      userMessage: message,
      botResponse: response
    });
  } catch (error) {
    console.error('🤖 Chatbot test error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot error'
    });
  }
});

// Mock videos endpoint
app.get('/api/videos', (req, res) => {
  const videos = [
    {
      id: "1",
      title: "Learn React.js - Full Course for Beginners",
      description: "Master React.js fundamentals",
      thumbnail: "https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg",
      duration: "2:25:00"
    },
    {
      id: "2", 
      title: "JavaScript Masterclass",
      description: "Complete JavaScript tutorial",
      thumbnail: "https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg",
      duration: "1:38:00"
    }
  ];
  res.json({ success: true, data: videos });
});

// Simple auth for testing
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (users.has(email)) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  const user = {
    id: Date.now().toString(),
    username,
    email,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF0000&color=fff`
  };

  users.set(email, user);

  const token = jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'User registered',
    data: { user, token }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Create temp user
  const user = {
    id: `temp_${socket.id}`,
    username: `User${Math.floor(Math.random() * 1000)}`,
    avatar: `https://ui-avatars.com/api/?name=User&background=666&color=fff`
  };
  
  connectedUsers.set(socket.id, user);
  socket.emit('user_connected', user);

  // Join video room
  socket.on('join_video', (videoId) => {
    console.log(`🎬 User joining video: ${videoId}`);
    
    // Leave previous rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });
    
    // Join new room
    socket.join(videoId);
    
    // Initialize chat messages
    if (!chatMessages.has(videoId)) {
      chatMessages.set(videoId, []);
    }
    
    // Send chat history
    const messages = chatMessages.get(videoId);
    socket.emit('chat_history', messages);
    
    // Send welcome message
    const welcomeMessage = {
      id: Date.now(),
      text: `Welcome to the chat! Feel free to ask questions.`,
      videoId: videoId,
      timestamp: new Date().toISOString(),
      user: 'Bot',
      userId: 'bot',
      isBot: true,
      userAvatar: 'https://ui-avatars.com/api/?name=Bot&background=3EA6FF&color=fff'
    };
    
    chatMessages.get(videoId).push(welcomeMessage);
    socket.emit('new_message', welcomeMessage);
  });

  // Handle new messages - SIMPLIFIED BOT LOGIC
  socket.on('send_message', (messageData) => {
    console.log('💬 Message received:', messageData);
    
    const { videoId, text } = messageData;
    const currentUser = connectedUsers.get(socket.id);
    
    if (!videoId || !text || !currentUser) {
      console.log('❌ Invalid message data');
      return;
    }

    // Create user message
    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      videoId: videoId,
      timestamp: new Date().toISOString(),
      user: currentUser.username,
      userId: currentUser.id,
      isBot: false,
      userAvatar: currentUser.avatar
    };
    
    // Store message
    if (!chatMessages.has(videoId)) {
      chatMessages.set(videoId, []);
    }
    chatMessages.get(videoId).push(userMessage);
    
    // Broadcast to room
    io.to(videoId).emit('new_message', userMessage);
    console.log('📤 Message broadcasted');
    
    // ALWAYS generate bot response for testing
    setTimeout(() => {
      console.log('🤖 Generating bot response...');
      const botResponse = chatbot.generateResponse(text);
      console.log('🤖 Bot response:', botResponse);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        videoId: videoId,
        timestamp: new Date().toISOString(),
        user: 'StudyBot',
        userId: 'bot',
        isBot: true,
        userAvatar: 'https://ui-avatars.com/api/?name=StudyBot&background=3EA6FF&color=fff'
      };
      
      chatMessages.get(videoId).push(botMessage);
      io.to(videoId).emit('new_message', botMessage);
      console.log('🤖✅ Bot message sent');
    }, 1000);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3001;

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Chatbot test: http://localhost:${PORT}/api/test-chatbot`);
  console.log(`📹 Videos: http://localhost:${PORT}/api/videos`);
});