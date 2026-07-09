import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiMail } from 'react-icons/fi';
const logoUrl = '/logo.svg';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 group mb-4 w-fit">
              <img
                src={logoUrl}
                alt="CivicFix Logo"
                className="w-8 h-8 shadow-md rounded-lg hover:scale-105 transition-transform"
              />
              <span className="font-extrabold text-xl tracking-tight text-stone-800">
                <span className="text-emerald-800">Civic</span>
                <span style={{ color: '#6b3f1f' }}>Fix</span>
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
                <Link to="/" className="text-stone-600 hover:text-emerald-700 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/report" className="text-stone-600 hover:text-emerald-700 transition-colors">Report an Issue</Link>
              </li>
              <li>
                <Link to="/feed" className="text-stone-600 hover:text-emerald-700 transition-colors">Issue Feed</Link>
              </li>
              <li>
                <span className="text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer">Live Map</span>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">Support</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer">FAQ</span>
              </li>
              <li>
                <span className="text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="text-stone-600 hover:text-emerald-700 transition-colors cursor-pointer">Contact Us</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} CivicFix. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-700 flex items-center justify-center transition-colors" aria-label="Facebook">
              <FiFacebook size={16} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-700 flex items-center justify-center transition-colors" aria-label="Instagram">
              <FiInstagram size={16} />
            </a>
            <a href="mailto:hello@civicfix.org" className="w-9 h-9 rounded-full bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-700 flex items-center justify-center transition-colors" aria-label="Email">
              <FiMail size={16} />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
