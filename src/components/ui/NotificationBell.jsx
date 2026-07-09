import React, { useState, useRef, useEffect } from 'react';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  NOTIFICATION_ICONS,
  RefreshCw, ClipboardList, ThumbsUp, FilePlus, CheckCircle2, Settings,
  Bell, Trash2,
} from '../../constants/icons';



function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const bellRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
  } = useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    if (notification.trackingId) {
      navigate(`/track?id=${notification.trackingId}`);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-all duration-200 focus:outline-none"
        aria-label="Notifications"
        id="notification-bell"
      >
        <FiBell className="w-6 h-6" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-emerald-600 rounded-full shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
          style={{ animation: 'slideUp 0.2s ease-out' }}
          id="notification-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-800 text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-800 hover:text-teal-900 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                  title="Mark all as read"
                >
                  <FiCheck size={12} /> Read all
                </button>
              )}
              {notifications.some((n) => n.isRead) && (
                <button
                  onClick={clearRead}
                  className="text-xs font-medium text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  title="Clear read notifications"
                >
                  <Trash2 size={12} className="text-slate-400" aria-hidden="true" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[360px] divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="mb-3"><Bell size={40} className="text-slate-300 mx-auto" aria-hidden="true" /></div>
                <p className="font-medium text-slate-500">No notifications yet</p>
                <p className="text-sm text-slate-400 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system;
                return (
                  <div
                    key={notification._id}
                    className={`group flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-all duration-200 hover:bg-stone-50 ${
                      !notification.isRead ? 'bg-emerald-50/60 border-l-3 border-l-emerald-600' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Type Icon */}
                    <div
                      className={`flex-shrink-0 w-9 h-9 ${config.color} rounded-xl flex items-center justify-center text-white text-sm shadow-sm mt-0.5`}
                    >
                      <config.Icon size={16} aria-hidden="true" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-slate-400">
                          {timeAgo(notification.createdAt)}
                        </span>
                        {notification.trackingId && (
                          <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                            {notification.trackingId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete notification"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Unread dot */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0 w-2.5 h-2.5 bg-emerald-600 rounded-full mt-2 shadow-sm" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 bg-gradient-to-r from-white to-slate-50">
              <p className="text-center text-xs text-slate-400">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
