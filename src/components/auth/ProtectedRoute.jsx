import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — Wraps pages that require authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Protected content
 * @param {string[]} [props.roles] - Allowed roles (e.g., ['admin', 'department'])
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-400 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check — if roles specified and user's role isn't in the list
  if (roles && !roles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="mb-4"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 mx-auto" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="4" y1="4" x2="20" y2="20"/></svg></div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You don't have permission to access this page.
            Required role: <span className="font-semibold text-stone-200">{roles.join(' or ')}</span>
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-stone-200 text-white rounded-xl font-semibold hover:bg-[#6b3f1f] transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return children;
}
