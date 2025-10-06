import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Get backend URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const useWebSocket = (token = null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    console.log('🔗 Connecting to WebSocket:', BACKEND_URL);
    
    socketRef.current = io(BACKEND_URL, {
      auth: {
        token: token || 'demo-token'
      }
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
    });

    // User events
    socketRef.current.on('user_connected', (user) => {
      console.log('👤 User connected:', user);
    });

    // Chat events
    socketRef.current.on('chat_history', (history) => {
      console.log('📨 Received chat history:', history.length, 'messages');
      setMessages(history);
    });

    socketRef.current.on('new_message', (message) => {
      console.log('📩 New message:', message);
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('message_liked', ({ messageId, likes }) => {
      console.log('👍 Message liked:', messageId, 'likes:', likes);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, likes } : msg
      ));
    });

    // Room events
    socketRef.current.on('user_joined', (data) => {
      console.log('👋 User joined:', data);
    });

    socketRef.current.on('user_left', (data) => {
      console.log('👋 User left:', data);
    });

    socketRef.current.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      // You can implement typing indicators here
    });

    socketRef.current.on('user_stop_typing', (data) => {
      console.log('💤 User stopped typing:', data);
      // You can implement typing indicators here
    });

    // Error events
    socketRef.current.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Connection test event
    socketRef.current.on('connection_test', (data) => {
      console.log('🔗 Connection test:', data);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  // Join a video room
  const joinRoom = useCallback((videoId) => {
    if (socketRef.current && isConnected) {
      console.log(`🎬 Joining room: ${videoId}`);
      socketRef.current.emit('join_video', videoId);
      setCurrentRoom(videoId);
      setMessages([]); // Clear messages when joining new room
    } else {
      console.log('❌ Cannot join room - socket not connected');
    }
  }, [isConnected]);

  // Send a message
  const sendMessage = useCallback((messageData) => {
    if (socketRef.current && isConnected) {
      console.log('💬 Sending message:', messageData);
      socketRef.current.emit('send_message', messageData);
    } else {
      console.log('❌ Cannot send message - socket not connected');
    }
  }, [isConnected]);

  // Like a message
  const likeMessage = useCallback((messageId) => {
    if (socketRef.current && isConnected) {
      console.log('👍 Liking message:', messageId);
      socketRef.current.emit('like_message', {
        messageId,
        videoId: currentRoom
      });
    } else {
      console.log('❌ Cannot like message - socket not connected');
    }
  }, [isConnected, currentRoom]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (socketRef.current && isConnected && currentRoom) {
      socketRef.current.emit('typing_start', currentRoom);
    }
  }, [isConnected, currentRoom]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (socketRef.current && isConnected && currentRoom) {
      socketRef.current.emit('typing_stop', currentRoom);
    }
  }, [isConnected, currentRoom]);

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    currentRoom,
    joinRoom,
    sendMessage,
    likeMessage,
    startTyping,
    stopTyping
  };
};