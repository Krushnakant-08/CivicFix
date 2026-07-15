import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] placeholder:text-slate-400 transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-emerald-700/15';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (event) => {
    clearError();
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch {
      // Error is set in AuthContext.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[var(--canvas)] px-5 py-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow)] md:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden bg-[var(--ink)] p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-100">CivicFix account</p>
            <h1 className="font-display mt-4 text-5xl font-semibold leading-tight">Return to your reports and updates.</h1>
            <p className="mt-4 max-w-sm text-white/70">
              Sign in to track progress, receive department updates, and manage your submitted issues.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/75">
            <div className="rounded-xl border border-white/10 p-4">Status updates stay connected to your account.</div>
            <div className="rounded-xl border border-white/10 p-4">Department dashboards remain role protected.</div>
          </div>
        </aside>

        <main className="p-6 sm:p-8 md:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-[var(--accent)]">Sign in</p>
            <h2 className="font-display mt-2 text-4xl font-semibold tracking-tight text-[var(--text)]">Welcome back</h2>
            <p className="mt-2 text-[var(--muted)]">Use the email and password connected to your CivicFix account.</p>
          </div>

          {error && (
            <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-[var(--text)]">
              Email address
              <span className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </span>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[var(--text)]">
              Password
              <span className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${inputClass} pl-10 pr-12`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
            </label>

            <Button variant="primary" type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            Do not have an account?{' '}
            <Link to="/register" className="font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]">
              Create one
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
