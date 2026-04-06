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
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
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
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Access Denied</h2>
          <p className="text-slate-600 mb-6">
            You don't have permission to access this page.
            Required role: <span className="font-semibold text-blue-600">{roles.join(' or ')}</span>
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return children;
}
