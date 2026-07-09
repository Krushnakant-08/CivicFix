import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdOutlineHome, MdOutlineReportProblem, MdOutlineRoute, MdOutlineForum, MdOutlineMap, MdOutlineDashboardCustomize, MdOutlinePersonOutline, MdOutlineLogout, MdOutlineMenu, MdOutlineClose, MdOutlineKeyboardArrowDown } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';
import {
  ClipboardList, BarChart3, TrendingUp, Building, LogOut,
} from '../../constants/icons';
const logoUrl = '/logo.svg';

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

  // Keyboard: Escape key closes dropdown/mobile menu
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Role badge color
  const roleBadge = {
    admin: 'bg-stone-100 text-stone-700',
    department: 'bg-emerald-100 text-emerald-800',
    citizen: 'bg-teal-100 text-teal-800',
  };

  const navLinkClass = (path) =>
    `font-medium transition-colors hover:text-emerald-700 ${isActive(path) ? 'text-emerald-800' : 'text-stone-700'}`;

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white/70 backdrop-blur-lg border-b border-slate-200/50 shadow-sm'
        : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src={logoUrl}
              alt="CivicFix Logo"
              className="w-10 h-10 shadow-lg group-hover:scale-105 transition-transform rounded-xl"
            />
            <span className="font-extrabold text-2xl tracking-tight text-stone-800">
              <span className="text-emerald-800">Civic</span>
              <span style={{ color: '#6b3f1f' }}>Fix</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={navLinkClass('/')}><span className="inline-flex items-center gap-2"><MdOutlineHome className="w-4 h-4" />Home</span></Link>
            <Link to="/report" className={navLinkClass('/report')}><span className="inline-flex items-center gap-2"><MdOutlineReportProblem className="w-4 h-4" />Report Issue</span></Link>
            <Link to="/track" className={navLinkClass('/track')}><span className="inline-flex items-center gap-2"><MdOutlineRoute className="w-4 h-4" />Track</span></Link>
            <Link to="/feed" className={navLinkClass('/feed')}><span className="inline-flex items-center gap-2"><MdOutlineForum className="w-4 h-4" />Feed</span></Link>
            <Link to="/map" className={navLinkClass('/map')}><span className="inline-flex items-center gap-2"><MdOutlineMap className="w-4 h-4" />Map</span></Link>

            {isAuthenticated && (
              <Link to="/my-reports" className={navLinkClass('/my-reports')}><span className="inline-flex items-center gap-2"><MdOutlinePersonOutline className="w-4 h-4" />My Reports</span></Link>
            )}

            {(isAdmin || isDepartment) && (
              <Link
                to={isAdmin ? '/dashboard/admin' : '/dashboard/department'}
                className={navLinkClass(isAdmin ? '/dashboard/admin' : '/dashboard/department')}
              >
                <span className="inline-flex items-center gap-2"><MdOutlineDashboardCustomize className="w-4 h-4" />Dashboard</span>
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
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-stone-200 to-emerald-100 rounded-lg flex items-center justify-center text-stone-700 font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-stone-700 text-sm max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <MdOutlineKeyboardArrowDown className={`w-4 h-4 text-stone-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
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
                    <Link to="/my-reports" className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-emerald-700 transition-colors">
                      <ClipboardList size={14} aria-hidden="true" /> My Reports
                    </Link>
                    {isAdmin && (
                      <>
                        <Link to="/dashboard/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-emerald-700 transition-colors">
                          <BarChart3 size={14} aria-hidden="true" /> Admin Dashboard
                        </Link>
                        <Link to="/dashboard/analytics" className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-emerald-700 transition-colors">
                          <TrendingUp size={14} aria-hidden="true" /> Analytics
                        </Link>
                      </>
                    )}
                    {isDepartment && (
                      <Link to="/dashboard/department" className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-emerald-700 transition-colors">
                        <Building size={14} aria-hidden="true" /> Dept Dashboard
                      </Link>
                    )}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <LogOut size={14} aria-hidden="true" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in */
              <>
                <Link to="/login">
                  <button className="font-medium text-stone-700 hover:text-stone-900 transition-colors">
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
                <div className="w-8 h-8 bg-gradient-to-br from-stone-200 to-emerald-100 rounded-lg flex items-center justify-center text-stone-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-stone-700 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-lg"
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <MdOutlineClose className="h-6 w-6" />
              ) : (
                <MdOutlineMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 rounded-b-2xl shadow-lg animate-slide-up" role="menu">
            <div className="px-4 py-4 space-y-2">
              <Link to="/" className="block px-4 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50" role="menuitem"><span className="inline-flex items-center gap-2"><MdOutlineHome className="w-4 h-4" />Home</span></Link>
              <Link to="/report" className="block px-4 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50" role="menuitem"><span className="inline-flex items-center gap-2"><MdOutlineReportProblem className="w-4 h-4" />Report Issue</span></Link>
              <Link to="/track" className="block px-4 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50" role="menuitem"><span className="inline-flex items-center gap-2"><MdOutlineRoute className="w-4 h-4" />Track Report</span></Link>
              <Link to="/feed" className="block px-4 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50" role="menuitem"><span className="inline-flex items-center gap-2"><MdOutlineForum className="w-4 h-4" />Community Feed</span></Link>
              <Link to="/map" className="block px-4 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50" role="menuitem"><span className="inline-flex items-center gap-2"><MdOutlineMap className="w-4 h-4" />Map</span></Link>

              {isAuthenticated && (
                <>
                  <Link to="/my-reports" className="block px-4 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50"><span className="inline-flex items-center gap-2"><MdOutlinePersonOutline className="w-4 h-4" />My Reports</span></Link>
                  {(isAdmin || isDepartment) && (
                    <Link
                      to={isAdmin ? '/dashboard/admin' : '/dashboard/department'}
                      className="block px-4 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50"
                    >
                      <span className="inline-flex items-center gap-2"><MdOutlineDashboardCustomize className="w-4 h-4" />Dashboard</span>
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
                    <Link to="/login" className="block px-4 py-3 rounded-xl text-stone-700 font-medium hover:bg-stone-50">Sign In</Link>
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
