const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const connectDB = require('./config/database');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins during development
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3002"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3002"],
  credentials: true
}));
app.use(express.json());

// Fallback in-memory storage if MongoDB is not available
const fallbackUsers = new Map();

// Check MongoDB connection status
const checkMongoDBConnection = () => {
  return mongoose.connection.readyState === 1;
};

// Auth Routes with MongoDB fallback
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const isMongoConnected = checkMongoDBConnection();
    
    if (isMongoConnected) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const user = await User.create({
        username,
        email,
        password,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF0000&color=fff`
      });

      const token = jwt.sign(
        { userId: user._id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt
          },
          token
        }
      });
    } else {
      if (fallbackUsers.has(email)) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const user = {
        id: userId,
        username,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF0000&color=fff`
      };

      fallbackUsers.set(email, user);

      const token = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'User registered successfully (fallback mode)',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt
          },
          token
        }
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const isMongoConnected = checkMongoDBConnection();
    
    if (isMongoConnected) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt
          },
          token
        }
      });
    } else {
      const user = fallbackUsers.get(email);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Login successful (fallback mode)',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt
          },
          token
        }
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const isMongoConnected = checkMongoDBConnection();
    
    if (isMongoConnected) {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    } else {
      const user = Array.from(fallbackUsers.values()).find(u => u.id === decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  const isMongoConnected = checkMongoDBConnection();
  let userCount = 0;

  if (isMongoConnected) {
    try {
      userCount = await User.countDocuments();
    } catch (error) {
      userCount = fallbackUsers.size;
    }
  } else {
    userCount = fallbackUsers.size;
  }

  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: isMongoConnected ? 'Connected' : 'Disconnected (using fallback)',
    users: userCount,
    storage: isMongoConnected ? 'MongoDB' : 'In-Memory'
  });
});

// Mock videos endpoint
app.get('/api/videos', (req, res) => {
  const videos = [
    {
      id: "1",
      title: "Learn React.js - Full Course for Beginners",
      description: "Master React.js fundamentals with this comprehensive tutorial. Learn components, hooks, state management, and build real projects.",
      url: "https://www.youtube.com/watch?v=SqcY0GlETPk",
      thumbnail: "https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg",
      duration: "2:25:00",
      category: "Programming",
      views: 2540000,
      likes: 85000,
      uploadedBy: "CodeMaster",
      uploadedById: "user_123",
      uploadDate: "2024-01-15T00:00:00.000Z"
    },
    {
      id: "2",
      title: "JavaScript Masterclass - From Zero to Hero",
      description: "Complete JavaScript tutorial covering modern ES6+ features, async programming, and advanced concepts.",
      url: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
      thumbnail: "https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg",
      duration: "1:38:00",
      category: "Programming", 
      views: 1850000,
      likes: 62000,
      uploadedBy: "WebDev Pro",
      uploadedById: "user_456",
      uploadDate: "2024-01-10T00:00:00.000Z"
    }
  ];
  res.json({ success: true, data: videos });
});

// Store active rooms and users
const activeRooms = new Map();
const connectedUsers = new Map();
const chatMessages = new Map();

// Enhanced chatbot
class ChatBot {
  constructor() {
    this.responses = {
      greetings: [
        "Hello! 👋 How are you enjoying this video?",
        "Hi there! Ready to learn something new today?",
        "Hey! Great to have you in the chat!",
        "Welcome! Feel free to ask any questions about the video."
      ],
      questions: {
        react: [
          "React is a JavaScript library for building user interfaces! It uses components to create reusable UI pieces.",
          "In React, components are the building blocks. They can be functional or class-based.",
          "React uses a virtual DOM for better performance when updating the UI.",
          "Hooks are a great feature in React that let you use state and lifecycle methods in functional components."
        ],
        javascript: [
          "JavaScript is a programming language that runs in browsers and on servers with Node.js.",
          "JavaScript is great for adding interactivity to websites and building web applications.",
          "ES6 introduced many great features like arrow functions, classes, and modules to JavaScript.",
          "JavaScript is single-threaded but uses an event loop for asynchronous operations."
        ],
        node: [
          "Node.js lets you run JavaScript on the server side, which is great for building APIs.",
          "With Node.js, you can build fast and scalable network applications.",
          "Node.js uses an event-driven, non-blocking I/O model that makes it efficient.",
          "The npm ecosystem is one of the largest package repositories in the world!"
        ],
        general: [
          "That's a great question! What specific aspect are you curious about?",
          "I'd love to help with that! Could you provide more details?",
          "Interesting question! Let me think about the best way to explain this...",
          "That's an important topic! The video might cover this in more detail later."
        ]
      },
      feedback: {
        positive: [
          "Glad you're enjoying it! 🎉 This is one of my favorite topics too!",
          "Awesome! Learning is so much fun when you're engaged with the content!",
          "Great to hear! Feel free to ask if you have any questions!",
          "I'm happy you're finding this useful! The instructor is really good at explaining complex concepts."
        ],
        confused: [
          "Don't worry, it can be confusing at first! Would you like me to explain it differently?",
          "That part can be tricky! Let me break it down for you...",
          "Many people find this challenging initially. The key is to practice!",
          "I understand it's confusing. Try watching that section again slowly."
        ]
      },
      technical: [
        "That's a technical aspect worth exploring! The implementation details are fascinating.",
        "Great technical question! The architecture behind this is really interesting.",
        "From a technical perspective, this involves several important concepts.",
        "Technically speaking, this works because of how the underlying system is designed."
      ],
      encouragement: [
        "Keep going! You're doing great! 💪",
        "Learning takes time, but you're on the right track!",
        "Don't give up! Every expert was once a beginner.",
        "You're asking great questions - that's how learning happens!"
      ]
    };
  }

  generateResponse(userMessage, videoTitle = '') {
    const message = userMessage.toLowerCase().trim();
    
    // Greetings
    if (message.match(/\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/)) {
      return this.getRandomResponse(this.responses.greetings);
    }
    
    // Questions about React
    if (message.includes('react') || (videoTitle.toLowerCase().includes('react') && (message.includes('what') || message.includes('how')))) {
      return this.getRandomResponse(this.responses.questions.react);
    }
    
    // Questions about JavaScript
    if (message.includes('javascript') || message.includes('js ') || (videoTitle.toLowerCase().includes('javascript') && (message.includes('what') || message.includes('how')))) {
      return this.getRandomResponse(this.responses.questions.javascript);
    }
    
    // Questions about Node.js
    if (message.includes('node') || (videoTitle.toLowerCase().includes('node') && (message.includes('what') || message.includes('how')))) {
      return this.getRandomResponse(this.responses.questions.node);
    }
    
    // General questions
    if (message.includes('?') || message.includes('what is') || message.includes('how to') || message.includes('can you') || message.includes('why does')) {
      return this.getRandomResponse(this.responses.questions.general);
    }
    
    // Positive feedback
    if (message.match(/\b(good|great|awesome|amazing|love|like|enjoy|perfect|excellent|wow|nice|cool)\b/)) {
      return this.getRandomResponse(this.responses.feedback.positive);
    }
    
    // Confusion or difficulty
    if (message.match(/\b(confus|difficult|hard|don.t understand|don't understand|help|stuck|problem|trouble)\b/)) {
      return this.getRandomResponse(this.responses.feedback.confused);
    }
    
    // Technical terms
    if (message.match(/\b(code|programming|function|variable|api|database|algorithm|bug|debug|error|syntax)\b/)) {
      return this.getRandomResponse(this.responses.technical);
    }
    
    // Encouragement needed
    if (message.match(/\b(hard|difficult|struggle|tired|bored|frustrat|annoying|complicated)\b/)) {
      return this.getRandomResponse(this.responses.encouragement);
    }
    
    // Default contextual responses based on video content
    if (videoTitle.toLowerCase().includes('react')) {
      const reactResponses = [
        "React's component-based architecture makes it really powerful for building UIs!",
        "Have you tried React Hooks? They make functional components even more useful!",
        "The virtual DOM in React is what makes it so fast compared to direct DOM manipulation.",
        "JSX might seem strange at first, but it makes React components much more readable!"
      ];
      return this.getRandomResponse(reactResponses);
    }
    
    if (videoTitle.toLowerCase().includes('javascript')) {
      const jsResponses = [
        "JavaScript's flexibility is both its strength and weakness!",
        "Did you know JavaScript can run on both the client and server side?",
        "Closures in JavaScript can be tricky but are really powerful once you understand them!",
        "Async/await makes handling asynchronous operations in JavaScript much cleaner!"
      ];
      return this.getRandomResponse(jsResponses);
    }
    
    if (videoTitle.toLowerCase().includes('node')) {
      const nodeResponses = [
        "Node.js is perfect for building real-time applications like this chat!",
        "The event loop is what makes Node.js so efficient for I/O operations.",
        "With Node.js, you can use the same language on both frontend and backend!",
        "Node.js packages from npm make development so much faster!"
      ];
      return this.getRandomResponse(nodeResponses);
    }
    
    // Final fallback responses
    const fallbackResponses = [
      "Thanks for sharing your thoughts!",
      "That's an interesting perspective!",
      "I appreciate you being part of this discussion!",
      "Great point! Learning together makes it more fun!",
      "That's worth thinking about! The video might have more insights on this.",
      "Interesting! I'm learning from our conversation too!",
      "Thanks for contributing to the discussion!",
      "That's a valuable insight! Keep the questions coming!",
      "I'm here to help with any questions about the video content!",
      "Feel free to ask if anything in the video needs clarification!"
    ];
    
    return this.getRandomResponse(fallbackResponses);
  }

  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

const chatbot = new ChatBot();

// Socket.io connection handling with improved error handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Get user from token
  const token = socket.handshake.auth?.token;
  let user = null;

  const createTempUser = () => {
    user = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: `User${Math.floor(Math.random() * 1000)}`,
      email: '',
      avatar: `https://ui-avatars.com/api/?name=User${Math.floor(Math.random() * 1000)}&background=666&color=fff`
    };
    connectedUsers.set(socket.id, user);
    socket.emit('user_connected', user);
    console.log('👤 Created temporary user:', user.username);
  };

  if (token && token !== 'demo-token') {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const isMongoConnected = checkMongoDBConnection();
      
      if (isMongoConnected) {
        // Try to find user in MongoDB
        User.findById(decoded.userId).then(dbUser => {
          if (dbUser) {
            user = {
              id: dbUser._id.toString(),
              username: dbUser.username,
              email: dbUser.email,
              avatar: dbUser.avatar
            };
            connectedUsers.set(socket.id, user);
            socket.emit('user_connected', user);
            console.log('👤 Authenticated user:', user.username);
          } else {
            createTempUser();
          }
        }).catch((error) => {
          console.log('MongoDB user lookup error:', error.message);
          createTempUser();
        });
      } else {
        // Try to find user in fallback storage
        const fallbackUser = Array.from(fallbackUsers.values()).find(u => u.id === decoded.userId);
        if (fallbackUser) {
          user = {
            id: fallbackUser.id,
            username: fallbackUser.username,
            email: fallbackUser.email,
            avatar: fallbackUser.avatar
          };
          connectedUsers.set(socket.id, user);
          socket.emit('user_connected', user);
          console.log('👤 Authenticated user (fallback):', user.username);
        } else {
          createTempUser();
        }
      }
    } catch (error) {
      console.log('Invalid token:', error.message);
      createTempUser();
    }
  } else {
    createTempUser();
  }

  // Join video room
  socket.on('join_video', (videoId) => {
    try {
      const currentUser = connectedUsers.get(socket.id);
      if (!currentUser) {
        console.log('❌ No user found for socket:', socket.id);
        return;
      }

      console.log(`🎬 ${currentUser.username} joined video: ${videoId}`);
      
      // Leave previous rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
      
      // Join new room
      socket.join(videoId);
      
      // Initialize room if not exists
      if (!activeRooms.has(videoId)) {
        activeRooms.set(videoId, new Set());
      }
      activeRooms.get(videoId).add(socket.id);
      
      // Initialize chat messages if not exists
      if (!chatMessages.has(videoId)) {
        chatMessages.set(videoId, []);
      }
      
      // Send chat history
      const messages = chatMessages.get(videoId);
      socket.emit('chat_history', messages);
      
      // Send welcome message
      const welcomeMessage = {
        id: Date.now(),
        text: `Welcome to the chat, ${currentUser.username}! 🎬 Feel free to discuss the video content and ask questions!`,
        videoId: videoId,
        timestamp: new Date().toISOString(),
        user: 'Bot',
        userId: 'bot',
        isBot: true,
        userAvatar: 'https://ui-avatars.com/api/?name=Bot&background=3EA6FF&color=fff'
      };
      
      // Add welcome message to chat history
      chatMessages.get(videoId).push(welcomeMessage);
      socket.emit('new_message', welcomeMessage);
      
      // Notify others in the room
      socket.to(videoId).emit('user_joined', {
        username: currentUser.username,
        message: `${currentUser.username} joined the chat`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error joining video room:', error);
      socket.emit('error', { message: 'Failed to join video room' });
    }
  });

  // Handle new messages - FIXED VERSION
  socket.on('send_message', (messageData) => {
    try {
      const { videoId, text } = messageData;
      const currentUser = connectedUsers.get(socket.id);
      
      if (!videoId || !text || !text.trim() || !currentUser) {
        console.log('❌ Invalid message data:', { videoId, text, user: !!currentUser });
        return;
      }
      
      console.log(`💬 ${currentUser.username} in video ${videoId}:`, text);
      
      // Create user message
      const userMessage = {
        id: Date.now(),
        text: text.trim(),
        videoId: videoId,
        timestamp: new Date().toISOString(),
        user: currentUser.username,
        userId: currentUser.id,
        isBot: false,
        likes: 0,
        userAvatar: currentUser.avatar
      };
      
      // Store message
      if (!chatMessages.has(videoId)) {
        chatMessages.set(videoId, []);
      }
      chatMessages.get(videoId).push(userMessage);
      
      // Broadcast to everyone in the video room (including sender)
      io.to(videoId).emit('new_message', userMessage);
      console.log(`📤 Message broadcast to room ${videoId}`);
      
      // Generate and send bot response
      const shouldRespond = Math.random() > 0.2 || 
                           text.includes('?') || 
                           text.toLowerCase().includes('help') ||
                           text.toLowerCase().includes('what is') ||
                           text.toLowerCase().includes('how to') ||
                           text.toLowerCase().includes('explain');
      
      if (shouldRespond) {
        setTimeout(() => {
          const videoContext = { title: "Programming Tutorial" };
          const botResponseText = chatbot.generateResponse(text, videoContext.title);
          
          const botMessage = {
            id: Date.now() + 1,
            text: botResponseText,
            videoId: videoId,
            timestamp: new Date().toISOString(),
            user: 'StudyBot',
            userId: 'bot',
            isBot: true,
            likes: 0,
            userAvatar: 'https://ui-avatars.com/api/?name=StudyBot&background=3EA6FF&color=fff'
          };
          
          chatMessages.get(videoId).push(botMessage);
          io.to(videoId).emit('new_message', botMessage);
          console.log(`🤖 Bot responded in room ${videoId}`);
        }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
      }
      
    } catch (error) {
      console.error('❌ Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message likes
  socket.on('like_message', (data) => {
    try {
      const { messageId, videoId } = data;
      console.log(`👍 Like received for message ${messageId} in room ${videoId}`);
      
      // Find message and update like count
      if (chatMessages.has(videoId)) {
        const messages = chatMessages.get(videoId);
        const message = messages.find(m => m.id === messageId);
        if (message) {
          message.likes = (message.likes || 0) + 1;
          io.to(videoId).emit('message_liked', {
            messageId,
            likes: message.likes,
            videoId
          });
          console.log(`✅ Message ${messageId} liked, total: ${message.likes}`);
        }
      }
    } catch (error) {
      console.error('Error liking message:', error);
    }
  });

  // Handle user typing
  socket.on('typing_start', (videoId) => {
    const currentUser = connectedUsers.get(socket.id);
    if (currentUser && videoId) {
      socket.to(videoId).emit('user_typing', {
        username: currentUser.username,
        videoId
      });
    }
  });

  socket.on('typing_stop', (videoId) => {
    const currentUser = connectedUsers.get(socket.id);
    if (currentUser && videoId) {
      socket.to(videoId).emit('user_stop_typing', {
        username: currentUser.username,
        videoId
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const currentUser = connectedUsers.get(socket.id);
    if (currentUser) {
      console.log(`❌ User disconnected: ${currentUser.username} (${reason})`);
      
      // Remove from active rooms
      activeRooms.forEach((users, videoId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          socket.to(videoId).emit('user_left', {
            username: currentUser.username,
            message: `${currentUser.username} left the chat`,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      connectedUsers.delete(socket.id);
    }
  });

  // Debug: Log all events
  socket.onAny((eventName, ...args) => {
    console.log(`📡 Socket event: ${eventName}`, args);
  });
});

// Error handling
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', err);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

const PORT = process.env.PORT || 3001;

console.log('🚀 Starting enhanced backend server...');
console.log('📡 Port:', PORT);
console.log('🔐 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Using default');
console.log('🗄️ MongoDB URI:', process.env.MONGODB_URI);
console.log('🌐 Environment:', process.env.NODE_ENV);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`🎯 Frontend: ${process.env.FRONTEND_URL}`);
  console.log(`🤖 Enhanced chatbot ready!`);
  console.log(`💬 WebSocket server ready for connections`);
  console.log(`💾 Storage: ${checkMongoDBConnection() ? 'MongoDB' : 'In-Memory (MongoDB not connected)'}`);
});