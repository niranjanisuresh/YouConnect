import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';

function Chat({ messages, onSendMessage, isConnected, currentVideo }) { // Removed socket parameter
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      console.log('Sending message from Chat component:', messageText);
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const userMessages = messages.filter(m => !m.isBot).length;
  const uniqueUsers = new Set(messages.map(m => m.userId)).size;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-top">
          <h3 className="chat-title">Live Chat</h3>
          <div className={`connection-status ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
            <div className="status-dot"></div>
            <span>
              {isConnected ? 'Connected' : 'Disconnected'}
              {!isConnected && ' - Check backend server'}
            </span>
          </div>
        </div>
        {currentVideo && (
          <p className="chat-subtitle">
            Chatting about: <span style={{ color: 'white' }}>{currentVideo.title}</span>
          </p>
        )}
        <div className="chat-stats">
          {userMessages} messages • {uniqueUsers} users
          {!isConnected && ' • Backend connection required'}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">
              {isConnected ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <h4 className="empty-chat-title">
              {isConnected ? 'No messages yet' : 'Backend Disconnected'}
            </h4>
            <p className="empty-chat-description">
              {isConnected 
                ? 'Start the conversation by sending a message!' 
                : 'Make sure the backend server is running on port 3001'
              }
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Message key={message.id || index} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <div className="input-group">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type your message..." : "Connect backend to chat..."}
              className="chat-input"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !messageText.trim()}
              className="send-button"
            >
              <span>Send</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          
          {!isConnected && (
            <div className="connection-warning">
              ⚠️ Backend server not found. Make sure it's running on port 3001
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Chat;