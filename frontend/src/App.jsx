import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import VideoList from './components/VideoList';
import Chat from './components/Chat';
import Login from './components/Login';
import VideoUpload from './components/VideoUpload';
import { authService } from './utils/auth';
import { useWebSocket } from './hooks/useWebSocket';
import './index.css';

// Mock videos data - Add this before the App component
const mockVideos = [
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
  },
  {
    id: "3",
    title: "Node.js & Express.js - Build REST APIs",
    description: "Learn to build scalable backend APIs with Node.js, Express.js, and MongoDB. Full project included.",
    url: "https://www.youtube.com/watch?v=fgTGADljAeg",
    thumbnail: "https://i.ytimg.com/vi/fgTGADljAeg/hqdefault.jpg",
    duration: "2:15:00",
    category: "Backend",
    views: 920000,
    likes: 31000,
    uploadedBy: "Backend Expert",
    uploadedById: "user_789",
    uploadDate: "2024-01-08T00:00:00.000Z"
  },
  {
    id: "4",
    title: "Python for Beginners - Learn Python in 1 Hour",
    description: "Quick Python introduction covering syntax, data structures, and basic programming concepts.",
    url: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
    thumbnail: "https://i.ytimg.com/vi/kqtD5dpn9C8/hqdefault.jpg",
    duration: "1:02:00",
    category: "Programming",
    views: 1680000,
    likes: 55000,
    uploadedBy: "Python Guru",
    uploadedById: "user_101",
    uploadDate: "2024-01-05T00:00:00.000Z"
  }
];

function App() {
  const [currentVideo, setCurrentVideo] = useState(mockVideos[0]);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [videos, setVideos] = useState(mockVideos);

  const { sendMessage, isConnected, socket } = useWebSocket(currentVideo?.id, setMessages);

  // Check if user is logged in on app start
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const userData = authService.getUser();
      setUser(userData);
      
      // Verify token with backend (optional)
      verifyToken();
    } else {
      setShowLogin(true);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: authService.authHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        // Token is invalid, logout
        handleLogout();
      }
    } catch (error) {
      console.log('Token verification failed, using stored user data');
      // Continue with stored user data if backend is not available
    }
  };

  const handleVideoSelect = (video) => {
    setCurrentVideo(video);
  };

  const handleSendMessage = (messageText) => {
    if (messageText.trim() && currentVideo) {
      const message = {
        text: messageText,
        videoId: currentVideo.id,
        timestamp: new Date().toISOString(),
        user: user?.username || 'Anonymous',
        userId: user?.id || 'anonymous' // Include user ID in messages
      };
      sendMessage(message);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setShowLogin(true);
  };

  const handleUpload = (newVideo) => {
    const videoWithUser = {
      ...newVideo,
      uploadedBy: user.username,
      uploadedById: user.id, // Store the user ID who uploaded
      uploadDate: new Date().toISOString()
    };
    
    setVideos(prevVideos => [videoWithUser, ...prevVideos]);
    setCurrentVideo(videoWithUser);
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.uploadedBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show login modal if no user is logged in
  if (!user && showLogin) {
    return (
      <Login 
        onLogin={handleLogin}
        onClose={() => setShowLogin(false)}
        showRegister={showRegister}
        onToggleMode={() => setShowRegister(!showRegister)}
      />
    );
  }

  return (
    <div className="app">
      <Header 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogoutClick={handleLogout}
        onUploadClick={() => setShowUpload(true)}
      />
      
      <div className="app-container">
        <div className="main-content">
          <div className="video-section">
            <VideoPlayer video={currentVideo} />
          </div>
          
          <div className="video-list-section">
            <VideoList 
              videos={filteredVideos}
              currentVideo={currentVideo}
              onVideoSelect={handleVideoSelect}
              user={user}
            />
          </div>
        </div>
        
        <div className="chat-section">
          <Chat 
            messages={messages}
            onSendMessage={handleSendMessage}
            isConnected={isConnected}
            currentVideo={currentVideo}
            user={user}
          />
        </div>
      </div>

      {showUpload && user && (
        <VideoUpload 
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
          user={user}
        />
      )}
    </div>
  );
}

export default App;