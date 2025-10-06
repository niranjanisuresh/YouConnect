import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Header from "./components/Header";
import VideoList from "./components/VideoList";
import VideoPlayer from "./components/VideoPlayer";
import Login from "./components/Login";
import Chat from "./components/Chat";


// Services
import authService from './services/authService';

// Hooks
import { useWebSocket } from './hooks/useWebSocket';

// Get backend URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Initialize WebSocket
  const { socket, isConnected, messages, sendMessage, joinRoom, likeMessage } = useWebSocket(
    user ? user.token : null
  );

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: authService.authHeaders()
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData.data);
          } else {
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle user login
  const handleLogin = async (userData) => {
    setUser(userData.user);
    authService.setToken(userData.token);
    setShowAuthModal(false);
  };

  // Handle user logout
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setSelectedVideo(null);
  };

  // Open auth modal in specific mode
  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Handle video selection
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    
    // Join the video room for chat
    if (socket && isConnected) {
      joinRoom(video.id);
    }
  };

  // Handle back to video list
  const handleBackToList = () => {
    setSelectedVideo(null);
  };

  // Handle sending chat messages
  const handleSendMessage = (text) => {
    if (selectedVideo && text.trim()) {
      sendMessage({
        videoId: selectedVideo.id,
        text: text.trim()
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar 
          user={user} 
          onLoginClick={() => openAuthModal('login')}
          onRegisterClick={() => openAuthModal('register')}
          onLogoutClick={handleLogout}
        />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={
                selectedVideo ? (
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Video Player Section */}
                    <div className="lg:w-2/3">
                      <VideoPlayer 
                        video={selectedVideo}
                        onBack={handleBackToList}
                      />
                    </div>
                    
                    {/* Chat Section */}
                    <div className="lg:w-1/3">
                      <Chat
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onLikeMessage={likeMessage}
                        isConnected={isConnected}
                        currentUser={user}
                        videoId={selectedVideo.id}
                      />
                    </div>
                  </div>
                ) : (
                  <VideoList onVideoSelect={handleVideoSelect} />
                )
              } 
            />
            
            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            mode={authMode}
            onClose={() => setShowAuthModal(false)}
            onSwitchMode={(mode) => setAuthMode(mode)}
            onSuccess={handleLogin}
            backendUrl={BACKEND_URL}
          />
        )}

        {/* Toast Notifications */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </Router>
  );
}

export default App;