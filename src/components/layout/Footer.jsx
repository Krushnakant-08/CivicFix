import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, ShieldCheck } from 'lucide-react';

const logoUrl = '/logo.svg';

const links = [
  { to: '/report', label: 'Report an issue' },
  { to: '/track', label: 'Track report' },
  { to: '/feed', label: 'Public feed' },
  { to: '/map', label: 'Live map' },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr_0.8fr]">
          <div>
            <Link to="/" className="mb-4 flex w-fit items-center gap-3">
              <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg border border-[var(--border)] bg-white p-1" />
              <span className="text-lg font-bold tracking-tight text-[var(--text)]">
                Civic<span className="text-[var(--accent)]">Fix</span>
              </span>
            </Link>
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
              A shared reporting workspace for residents, departments, and administrators working through local civic issues.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-[var(--text)]">Service links</h2>
            <div className="mt-4 grid gap-2">
              {links.map((link) => (
                <Link key={link.to} to={link.to} className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* <div>
            <h2 className="text-sm font-bold text-[var(--text)]">Contact</h2>
            <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              <a href="mailto:hello@civicfix.org" className="inline-flex items-center gap-2 hover:text-[var(--accent)]">
                <Mail size={16} aria-hidden="true" />
                hello@civicfix.org
              </a>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} aria-hidden="true" />
                Latrobe civic services
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={16} aria-hidden="true" />
                Transparent case history
              </span>
            </div>
          </div> */}
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)] md:flex-row">
          <p>Copyright {new Date().getFullYear()} CivicFix. All rights reserved.</p>
          <p>Built for accessible civic reporting.</p>
        </div>
      </div>
    </footer>
  );
}
