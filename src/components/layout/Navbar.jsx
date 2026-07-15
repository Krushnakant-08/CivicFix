import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquareText,
  Route,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';

const logoUrl = '/logo.svg';

const publicLinks = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/report', label: 'Report', Icon: ClipboardList },
  { to: '/track', label: 'Track', Icon: Route },
  { to: '/feed', label: 'Feed', Icon: MessageSquareText },
  { to: '/map', label: 'Map', Icon: Map },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin, isDepartment } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const isActive = (path) => location.pathname === path;
  const dashboardPath = isAdmin ? '/dashboard/admin' : '/dashboard/department';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = (path) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive(path)
        ? 'bg-emerald-50 text-[var(--accent)]'
        : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]'
    }`;

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`fixed top-0 z-50 w-full transition ${
        isScrolled ? 'border-b border-[var(--border)] bg-white/92 shadow-sm backdrop-blur-md' : 'bg-[var(--canvas)]/90 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="CivicFix home">
            <img src={logoUrl} alt="" className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white p-1 shadow-sm" />
            <span className="text-xl font-bold tracking-tight text-[var(--text)]">
              Civic<span className="text-[var(--accent)]">Fix</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {publicLinks.map(({ to, label, Icon }) => (
              <Link key={to} to={to} className={linkClass(to)}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link to="/my-reports" className={linkClass('/my-reports')}>
                <UserRound size={16} aria-hidden="true" />
                My Reports
              </Link>
            )}
            {(isAdmin || isDepartment) && (
              <Link to={dashboardPath} className={linkClass(dashboardPath)}>
                <LayoutDashboard size={16} aria-hidden="true" />
                Dashboard
              </Link>
            )}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && <NotificationBell />}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="inline-flex max-w-[220px] items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                  type="button"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-sm font-bold text-[var(--accent)]">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="truncate">{user?.name || 'Account'}</span>
                  <ChevronDown size={16} className={dropdownOpen ? 'rotate-180 transition' : 'transition'} aria-hidden="true" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow)]">
                    <div className="border-b border-[var(--border)] p-4">
                      <p className="font-bold text-[var(--text)]">{user?.name}</p>
                      <p className="truncate text-sm text-[var(--muted)]">{user?.email}</p>
                      <p className="mt-2 inline-flex rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--accent)]">
                        {user?.role || 'citizen'}
                      </p>
                    </div>
                    <div className="p-2">
                      <Link to="/my-reports" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]">
                        <ClipboardList size={15} aria-hidden="true" /> My Reports
                      </Link>
                      {isAdmin && (
                        <Link to="/dashboard/analytics" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]">
                          <BarChart3 size={15} aria-hidden="true" /> Analytics
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                        type="button"
                      >
                        <LogOut size={15} aria-hidden="true" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--text)]">
                  Sign in
                </Link>
                <Link to="/register">
                  <Button className="px-4 py-2.5">Create account</Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text)]"
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="border-t border-[var(--border)] bg-white py-3 md:hidden" role="menu">
            <div className="grid gap-1">
              {publicLinks.map(({ to, label, Icon }) => (
                <Link key={to} to={to} className={linkClass(to)} role="menuitem">
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </Link>
              ))}
              {isAuthenticated && (
                <Link to="/my-reports" className={linkClass('/my-reports')} role="menuitem">
                  <UserRound size={17} aria-hidden="true" />
                  My Reports
                </Link>
              )}
              {(isAdmin || isDepartment) && (
                <Link to={dashboardPath} className={linkClass(dashboardPath)} role="menuitem">
                  <LayoutDashboard size={17} aria-hidden="true" />
                  Dashboard
                </Link>
              )}
            </div>
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              {isAuthenticated ? (
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50" type="button">
                  <LogOut size={17} aria-hidden="true" />
                  Sign out
                </button>
              ) : (
                <div className="grid gap-2">
                  <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)]">Sign in</Link>
                  <Link to="/register">
                    <Button className="w-full">Create account</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
