import { useState, useEffect, useContext, createContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { asyncTryCatch } from '../utils/errorUtils.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Create a context for authentication
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigationInProgress = useRef(false);
  const navigate = useNavigate();
  
  // Create a safer navigation function that throttles navigation attempts
  const safeNavigate = useCallback((path) => {
    // Prevent navigation if one is already in progress
    if (navigationInProgress.current) {
      console.log('Navigation already in progress, ignoring new request');
      return;
    }
    
    // Set navigation lock
    navigationInProgress.current = true;
    
    try {
      // Use React Router's navigate with replace option to avoid browser history issues
      navigate(path, { replace: true });
    } catch (error) {
      console.warn('Navigation error - using fallback', error);
      
      // Fallback to window.location if navigate fails
      try {
        window.location.href = path;
      } catch (windowError) {
        console.error('Failed to navigate using window.location', windowError);
      }
    }
    
    // Clear navigation lock after a delay
    setTimeout(() => {
      navigationInProgress.current = false;
    }, 500);
  }, [navigate]);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      // If we're in the process of checking, don't check again
      if (isLoading && navigationInProgress.current) return;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to decode the token to verify it client-side
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isTokenExpired = Date.now() >= payload.exp * 1000;
        
        if (isTokenExpired) {
          console.log('Token has expired');
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // Get user data from localStorage if available
          const storedUser = localStorage.getItem('user');
          let userData = null;
          
          try {
            userData = storedUser ? JSON.parse(storedUser) : null;
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
          }
          
          // Token is valid, set user info
          setUser(userData || {
            id: payload.id,
            role: payload.role
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      setIsLoading(false);
    };

    checkLoginStatus();
  }, [isLoading]);

  // Login function - only navigate on success
  const login = async (credentials) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        
        // Only navigate if we successfully logged in
        safeNavigate('/');
        return user;
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
    
    return null;
  };

  // Logout function with debounce
  const logout = useCallback(() => {
    if (navigationInProgress.current) return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    safeNavigate('/login');
  }, [safeNavigate]);

  // Register function
  const register = async (userData) => {
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, userData);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        safeNavigate('/');
        return user;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
    
    return null;
  };

  // Update user profile
  const updateProfile = async (userData) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/profile`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
    
    return null;
  };

  // Get authentication header
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    getAuthHeader
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth; 