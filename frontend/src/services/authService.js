// services/authService.js

// Get backend URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const authService = {
  // Get stored token
  getToken() {
    return localStorage.getItem('authToken');
  },

  // Set token
  setToken(token) {
    localStorage.setItem('authToken', token);
  },

  // Remove token (logout)
  logout() {
    localStorage.removeItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Get auth headers for API calls
  authHeaders() {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  },

  // Login user
  async login(email, password) {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  },

  // Register user
  async register(username, email, password) {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  },

  // Get current user
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: this.authHeaders()
    });

    if (!response.ok) {
      this.logout();
      return null;
    }

    const data = await response.json();
    return data.data;
  }
};

export default authService;