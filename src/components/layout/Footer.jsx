import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 group mb-4 w-fit">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                C
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Civic<span className="text-blue-600">Connect</span>
              </span>
            </Link>
            <p className="text-slate-500 leading-relaxed max-w-sm">
              Empowering citizens to build better communities. Report, track, and resolve local civic issues with complete transparency.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-slate-500 hover:text-blue-600 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/report" className="text-slate-500 hover:text-blue-600 transition-colors">Report an Issue</Link>
              </li>
              <li>
                <span className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Issue Feed</span>
              </li>
              <li>
                <span className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Live Map</span>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">Support</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">FAQ</span>
              </li>
              <li>
                <span className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Contact Us</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} CivicConnect. All rights reserved.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 cursor-pointer transition-colors" aria-hidden="true"></div>
            <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 cursor-pointer transition-colors" aria-hidden="true"></div>
            <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 cursor-pointer transition-colors" aria-hidden="true"></div>
          </div>
        </div>

      </div>
    </footer>
  );
}
