import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)]">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(94,114,96,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(17,24,39,0.04),transparent_30%)]" />
        <div className="mx-auto flex min-h-[calc(100dvh-80px)] max-w-5xl items-center px-5 py-10 lg:px-8 lg:py-14">
          <div className="relative z-10 max-w-3xl animate-slide-up">
            {/* <p className="mb-5 inline-flex rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] backdrop-blur-sm">
              Civic issue reporting for Latrobe communities
            </p> */}
            <h1 className="font-display max-w-4xl text-5xl font-semibold leading-[0.96] text-[var(--text)] text-balance md:text-7xl lg:text-[5.25rem]">
              Make local problems visible, traceable, and fixable.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)] md:text-lg">
              Report once, track progress, and keep the handoff readable for everyone involved.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/report" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto">
                  Report issue <ArrowRight size={18} aria-hidden="true" />
                </Button>
              </Link>
              <p className="text-sm text-[var(--muted)]">
                Track and review reports from one place.
              </p>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-4 border-t border-[var(--border)] pt-6 text-sm text-[var(--muted)]">
              {[
                ['24/7', 'online intake'],
                ['Live', 'status updates'],
                ['Public', 'issue map'],
              ].map(([value, label]) => (
                <div key={label} className="space-y-1">
                  <p className="font-display text-3xl font-semibold text-[var(--text)]">{value}</p>
                  <p>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
