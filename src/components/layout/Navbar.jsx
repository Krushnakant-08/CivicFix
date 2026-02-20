import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

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
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900">
              Civic<span className="text-blue-600">Connect</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`font-medium transition-colors hover:text-blue-600 ${
                isActive('/') ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              Home
            </Link>
            
            <Link 
              to="/report" 
              className={`font-medium transition-colors hover:text-blue-600 ${
                isActive('/report') ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              Report Issue
            </Link>

            <div className="w-px h-6 bg-slate-200"></div> 
            
            <button className="font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign In
            </button>
            
            <Link to="/report">
              <Button variant="primary" className="py-2.5 px-5 text-sm">
                New Report
              </Button>
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button className="text-slate-600 hover:text-slate-900 focus:outline-none" type="button" aria-label="Open menu">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
