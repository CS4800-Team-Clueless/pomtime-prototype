import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Update this with your actual backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setToken(tokenToVerify);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/'); // Redirect to home page after login
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/login'); // Redirect to login page after logout
    }
  };

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, { ...options, headers });

    // If unauthorized, logout
    if (response.status === 401) {
      logout();
      throw new Error('Session expired');
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    fetchWithAuth,
    API_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};