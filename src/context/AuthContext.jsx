import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civicfix_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── Load user from token on mount ───────────────────
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await authAPI.getMe();
        setUser(data.user);
      } catch (err) {
        console.error('Auth load failed:', err);
        // Token invalid/expired — clean up
        localStorage.removeItem('civicfix_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // ─── Register ────────────────────────────────────────
  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const data = await authAPI.register(userData);
      localStorage.setItem('civicfix_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ─── Login ───────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const data = await authAPI.login(credentials);
      localStorage.setItem('civicfix_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ─── Logout ──────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('civicfix_token');
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  // ─── Update user locally ─────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  // ─── Clear error ─────────────────────────────────────
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDepartment: user?.role === 'department',
    isCitizen: user?.role === 'citizen',
    register,
    login,
    logout,
    updateUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
