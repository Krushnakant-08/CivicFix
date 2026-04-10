import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, onSocketEvent, offSocketEvent } from '../services/socket';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketInitialized = useRef(false);

  // ─── Fetch helpers (direct fetch to avoid circular deps) ──
  const fetchWithAuth = useCallback(async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  }, [token]);

  // ─── Load notifications from API ───────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchWithAuth('/notifications?limit=50');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [token, fetchWithAuth]);

  // ─── Load unread count only ────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchWithAuth('/notifications/unread-count');
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [token, fetchWithAuth]);

  // ─── Mark single notification as read ──────────────────
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await fetchWithAuth(`/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [fetchWithAuth]);

  // ─── Mark all as read ──────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await fetchWithAuth('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [fetchWithAuth]);

  // ─── Delete single notification ────────────────────────
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await fetchWithAuth(`/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications((prev) => {
        const removed = prev.find((n) => n._id === notificationId);
        if (removed && !removed.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [fetchWithAuth]);

  // ─── Clear all read ────────────────────────────────────
  const clearRead = useCallback(async () => {
    try {
      await fetchWithAuth('/notifications', { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  }, [fetchWithAuth]);

  // ─── Socket.io connection ──────────────────────────────
  useEffect(() => {
    if (isAuthenticated && token && !socketInitialized.current) {
      socketInitialized.current = true;
      connectSocket(token);

      // Listen for new notifications via WebSocket
      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      const handleCountUpdate = ({ count }) => {
        setUnreadCount(count);
      };

      onSocketEvent('notification:new', handleNewNotification);
      onSocketEvent('notification:count', handleCountUpdate);

      // Initial load
      fetchNotifications();

      return () => {
        offSocketEvent('notification:new', handleNewNotification);
        offSocketEvent('notification:count', handleCountUpdate);
        disconnectSocket();
        socketInitialized.current = false;
      };
    }

    if (!isAuthenticated) {
      disconnectSocket();
      socketInitialized.current = false;
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
