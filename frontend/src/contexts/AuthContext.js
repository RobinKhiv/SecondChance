import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL, getAuthHeaders } from '../config/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    navigate('/');
  }, [navigate]);

  const verifyAuth = useCallback(async () => {
    if (token) {
      try {
        const response = await axios.get(`${API_URL}/api/users/profile`, {
          headers: getAuthHeaders(token)
        });
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Auth verification failed:', error);
        logout();
      }
    }
  }, [token, logout]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      const { token: newToken, user } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(newToken);
      setCurrentUser(user);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password
      });

      const { token: newToken, user } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setToken(newToken);
      setCurrentUser(user);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/users/profile`,
        updates,
        { headers: getAuthHeaders(token) }
      );

      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    token,
    login,
    logout,
    register,
    updateProfile,
    verifyAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 