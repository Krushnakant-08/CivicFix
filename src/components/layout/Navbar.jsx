import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin, isDepartment } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Role badge color
  const roleBadge = {
    admin: 'bg-purple-100 text-purple-700',
    department: 'bg-amber-100 text-amber-700',
    citizen: 'bg-blue-100 text-blue-700',
  };

  const navLinkClass = (path) =>
    `font-medium transition-colors hover:text-blue-600 ${
      isActive(path) ? 'text-blue-600' : 'text-slate-600'
    }`;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/70 backdrop-blur-lg border-b border-slate-200/50 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Civic<span className="text-blue-600">Fix</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={navLinkClass('/')}>Home</Link>
            <Link to="/report" className={navLinkClass('/report')}>Report Issue</Link>
            <Link to="/track" className={navLinkClass('/track')}>Track</Link>
            <Link to="/feed" className={navLinkClass('/feed')}>Feed</Link>
            <Link to="/map" className={navLinkClass('/map')}>Map</Link>

            {isAuthenticated && (
              <Link to="/my-reports" className={navLinkClass('/my-reports')}>My Reports</Link>
            )}

            {(isAdmin || isDepartment) && (
              <Link
                to={isAdmin ? '/dashboard/admin' : '/dashboard/department'}
                className={navLinkClass(isAdmin ? '/dashboard/admin' : '/dashboard/department')}
              >
                Dashboard
              </Link>
            )}

            {isAuthenticated && (
              <NotificationBell />
            )}

            <div className="w-px h-6 bg-slate-200"></div>

            {isAuthenticated ? (
              /* Logged-in User Menu */
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-slate-100 px-3 py-2 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-700 text-sm max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-slide-up">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 text-sm">{user?.name}</p>
                      <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[user?.role] || roleBadge.citizen}`}>
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                      </span>
                    </div>
                    <Link to="/my-reports" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                      📋 My Reports
                    </Link>
                    {isAdmin && (
                      <Link to="/dashboard/admin" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                        📊 Admin Dashboard
                      </Link>
                    )}
                    {isDepartment && (
                      <Link to="/dashboard/department" className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                        🏢 Dept Dashboard
                      </Link>
                    )}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in */
              <>
                <Link to="/login">
                  <button className="font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" className="py-2.5 px-5 text-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {isAuthenticated && (
              <>
                <NotificationBell />
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none"
              type="button"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 rounded-b-2xl shadow-lg animate-slide-up">
            <div className="px-4 py-4 space-y-2">
              <Link to="/" className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50">Home</Link>
              <Link to="/report" className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50">Report Issue</Link>
              <Link to="/track" className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50">Track Report</Link>
              <Link to="/feed" className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50">Community Feed</Link>
              <Link to="/map" className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50">Map</Link>

              {isAuthenticated && (
                <>
                  <Link to="/my-reports" className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50">My Reports</Link>
                  {(isAdmin || isDepartment) && (
                    <Link
                      to={isAdmin ? '/dashboard/admin' : '/dashboard/department'}
                      className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
                    >
                      Dashboard
                    </Link>
                  )}
                </>
              )}

              <div className="border-t border-slate-100 pt-3 mt-3">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="px-4 py-2">
                      <p className="font-semibold text-slate-900">{user?.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge[user?.role] || roleBadge.citizen}`}>
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 rounded-xl text-red-600 font-medium hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" className="block px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50">Sign In</Link>
                    <Link to="/register" className="block">
                      <Button variant="primary" className="w-full">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
