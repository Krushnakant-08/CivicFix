import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, loginUser, signupUser } from '../utils/api';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'latrobe_auth';

const readStoredAuth = () => {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!value) {
      return { token: null, user: null };
    }

    const parsed = JSON.parse(value);
    return {
      token: parsed.token || null,
      user: parsed.user || null,
    };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(readStoredAuth);
  const [isLoading, setIsLoading] = useState(true);

  const persistAuth = useCallback((nextAuth) => {
    setAuth(nextAuth);

    if (!nextAuth.token || !nextAuth.user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  }, []);

  const logout = useCallback(() => {
    persistAuth({ token: null, user: null });
  }, [persistAuth]);

  const login = useCallback(
    async (credentials) => {
      const data = await loginUser(credentials);
      const nextAuth = {
        token: data.token,
        user: data.user,
      };
      persistAuth(nextAuth);
      return data;
    },
    [persistAuth]
  );

  const signup = useCallback(
    async (payload) => {
      const data = await signupUser(payload);
      const nextAuth = {
        token: data.token,
        user: data.user,
      };
      persistAuth(nextAuth);
      return data;
    },
    [persistAuth]
  );

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!auth.token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getMe(auth.token);
        persistAuth({ token: auth.token, user: data.user });
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, [auth.token, logout, persistAuth]);

  const value = useMemo(
    () => ({
      user: auth.user,
      token: auth.token,
      isAuthenticated: Boolean(auth.token && auth.user),
      isLoading,
      login,
      signup,
      logout,
    }),
    [auth.token, auth.user, isLoading, login, logout, signup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
