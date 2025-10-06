import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { authService } from '../utils/auth';

export const useWebSocket = (videoId, setMessages) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Try multiple connection URLs
    const backendUrls = [
      'http://localhost:3001',
      'http://127.0.0.1:3001'
    ];

    let connected = false;

    const tryConnect = (urlIndex = 0) => {
      if (urlIndex >= backendUrls.length) {
        console.log('❌ All connection attempts failed');
        return;
      }

      const backendUrl = backendUrls[urlIndex];
      console.log(`🔗 Attempting to connect to: ${backendUrl}`);

      const token = authService.getToken();
      
      socketRef.current = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        auth: {
          token: token || 'demo-token'
        }
      });

      socketRef.current.on('connect', () => {
        connected = true;
        console.log('✅ Connected to WebSocket server at:', backendUrl);
        
        // Join video room
        if (videoId) {
          console.log('Joining video room:', videoId);
          socketRef.current.emit('join_video', videoId);
        }
      });

      socketRef.current.on('new_message', (message) => {
        console.log('New message received:', message);
        setMessages(prev => [...prev, message]);
      });

      socketRef.current.on('chat_history', (messages) => {
        console.log('Chat history received:', messages);
        setMessages(messages);
      });

      socketRef.current.on('bot_response', (response) => {
        console.log('Bot response received:', response);
        setMessages(prev => [...prev, response]);
      });

      socketRef.current.on('user_connected', (userData) => {
        console.log('User connected:', userData);
      });

      socketRef.current.on('user_joined', (data) => {
        console.log('User joined:', data);
      });

      socketRef.current.on('user_left', (data) => {
        console.log('User left:', data);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ Disconnected from WebSocket server. Reason:', reason);
        connected = false;
      });

      socketRef.current.on('connect_error', (error) => {
        console.log(`❌ Connection failed to ${backendUrl}:`, error.message);
        connected = false;
        
        // Try next URL after a delay
        setTimeout(() => {
          if (!connected) {
            socketRef.current?.disconnect();
            tryConnect(urlIndex + 1);
          }
        }, 1000);
      });

      socketRef.current.on('error', (error) => {
        console.log('❌ WebSocket error:', error);
      });
    };

    // Start connection attempts
    tryConnect();

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up WebSocket connection');
        socketRef.current.disconnect();
      }
    };
  }, [videoId, setMessages]);

  // Rejoin room when videoId changes
  useEffect(() => {
    if (socketRef.current?.connected && videoId) {
      console.log('Switching to video room:', videoId);
      socketRef.current.emit('join_video', videoId);
      setMessages([]);
    }
  }, [videoId, setMessages]);

  const sendMessage = (message) => {
    if (socketRef.current?.connected) {
      console.log('Sending message:', message);
      socketRef.current.emit('send_message', message);
    } else {
      console.log('Cannot send message - socket not connected');
      alert('Cannot send message - backend server is not connected');
    }
  };

  return {
    sendMessage,
    isConnected: socketRef.current?.connected || false,
    socket: socketRef.current
  };
};