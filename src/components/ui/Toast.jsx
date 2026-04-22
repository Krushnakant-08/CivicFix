import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Global toast event bus ──────────────────────────────
const listeners = new Set();

export function showToast(message, type = 'error', duration = 3500) {
  const id = Date.now() + Math.random();
  listeners.forEach((fn) => fn({ id, message, type, duration }));
}

// ─── Toast Container (mount once in App) ─────────────────
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev.slice(-4), toast]); // max 5
      timers.current[toast.id] = setTimeout(() => removeToast(toast.id), toast.duration);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
        maxWidth: '420px',
        width: '90vw',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-item"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '14px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            fontSize: '0.85rem',
            fontWeight: 600,
            lineHeight: 1.4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            ...(toast.type === 'error'
              ? {
                  background: 'rgba(239, 68, 68, 0.95)',
                  color: '#fff',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }
              : toast.type === 'success'
              ? {
                  background: 'rgba(16, 185, 129, 0.95)',
                  color: '#fff',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }
              : {
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#334155',
                  border: '1px solid rgba(226, 232, 240, 0.6)',
                }),
          }}
        >
          <span style={{ fontSize: '1.1rem', flexShrink: 0, display: 'inline-flex' }}>
            {toast.type === 'error' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            ) : toast.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            )}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              flexShrink: 0,
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(255,255,255,0.2)',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              transition: 'background 0.15s',
            }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
