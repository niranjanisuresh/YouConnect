import React, { useState } from 'react';
import { authService } from '../utils/auth';
import './Login.css';

function Login({ onLogin, onClose, showRegister, onToggleMode }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = showRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = showRegister 
        ? { username: formData.username, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Store user data and token
        authService.setUser(data.data.user, data.data.token);
        onLogin(data.data.user);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Network error. Please try again.');
      
      // Fallback to demo mode if backend is not available
      handleDemoLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleDemoLogin = () => {
    const demoUser = {
      id: `demo_${Date.now()}`,
      username: 'Demo User',
      email: 'demo@example.com',
      avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=FF0000&color=fff'
    };
    
    authService.setUser(demoUser, 'demo-token');
    onLogin(demoUser);
  };

  return (
    <div className="login-overlay">
      <div className="login-modal">
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">YC</div>
            <h2>YouConnect</h2>
          </div>
          <h3>{showRegister ? 'Create Account' : 'Welcome Back'}</h3>
          <p>{showRegister ? 'Join our community today' : 'Sign in to continue'}</p>
        </div>

        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {showRegister && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                minLength="3"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              minLength="6"
            />
            {showRegister && (
              <small className="password-hint">
                Password must be at least 6 characters long
              </small>
            )}
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              showRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="demo-section">
          <button onClick={handleDemoLogin} className="demo-button">
            Try Demo Account
          </button>
        </div>

        <div className="login-footer">
          <p>
            {showRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={onToggleMode} className="toggle-mode">
              {showRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;