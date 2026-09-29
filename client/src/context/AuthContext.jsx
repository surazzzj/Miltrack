import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('miltrack_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('miltrack_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state on mount
  const checkAuth = useCallback(async () => {
    const existingToken = localStorage.getItem('miltrack_token');
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setToken(existingToken);
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      setUser(null);
      setToken(null);
      localStorage.removeItem('miltrack_token');
      localStorage.removeItem('miltrack_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setToken(response.token);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isCommander = user?.role === 'BASE_COMMANDER';
  const isLogistics = user?.role === 'LOGISTICS_OFFICER';

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    isAdmin,
    isCommander,
    isLogistics,
    login,
    logout,
    checkAuth,
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
