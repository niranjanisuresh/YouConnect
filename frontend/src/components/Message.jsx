import React, { useState } from 'react';

function Message({ message }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(message.likes || 0);

  const isUser = message.user === 'You' || message.userId?.includes('user');
  const isBot = message.user === 'Bot' || message.isBot;
  const messageClass = isUser ? 'message-user' : isBot ? 'message-bot' : 'message-other';

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleLike = () => {
    if (!isLiked) {
      setLikeCount(prev => prev + 1);
      setIsLiked(true);
    } else {
      setLikeCount(prev => prev - 1);
      setIsLiked(false);
    }
  };

  return (
    <div className={`message ${messageClass}`}>
      <div className="message-bubble">
        <div className="message-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="message-username">
              {message.user}
              {isBot && <span className="bot-badge">BOT</span>}
            </span>
          </div>
          <span className="message-time">
            {formatTime(message.timestamp)}
          </span>
        </div>
        
        <p className="message-text">{message.text}</p>
        
        <div className="message-actions">
          <button 
            className={`like-button ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <svg className="like-icon" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Message;