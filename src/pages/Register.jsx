import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)] placeholder:text-slate-400 transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-emerald-700/15';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    clearError();
    setLocalError(null);
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });
      navigate('/', { replace: true });
    } catch {
      // Error is set in AuthContext.
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[var(--canvas)] px-5 py-10">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow)] lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden bg-[var(--ink)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-100">New resident account</p>
            <h1 className="font-display mt-4 text-5xl font-semibold leading-tight">Create a reliable record for every issue you report.</h1>
            <p className="mt-4 max-w-sm text-white/70">
              Your account keeps submissions, tracking IDs, and follow-up messages in one place.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-white/75">
            <div className="rounded-xl border border-white/10 p-4">Personal details help teams clarify reports faster.</div>
            <div className="rounded-xl border border-white/10 p-4">Phone number is optional and only sent when provided.</div>
          </div>
        </aside>

        <main className="p-6 sm:p-8 md:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-[var(--accent)]">Create account</p>
            <h2 className="font-display mt-2 text-4xl font-semibold tracking-tight text-[var(--text)]">Join CivicFix</h2>
            <p className="mt-2 text-[var(--muted)]">Set up your profile before submitting or tracking reports.</p>
          </div>

          {displayError && (
            <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-[var(--text)]">
              Full name
              <span className="relative">
                <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                  placeholder="Avery Singh"
                  autoComplete="name"
                />
              </span>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-[var(--text)]">
                Email
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
                Phone optional
                <span className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${inputClass} pl-10`}
                    placeholder="+91 98765 43210"
                    autoComplete="tel"
                  />
                </span>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
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
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                  />
                </span>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[var(--text)]">
                Confirm password
                <span className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} aria-hidden="true" />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`${inputClass} pl-10 pr-12`}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="flex w-fit items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
            >
              {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              {showPassword ? 'Hide passwords' : 'Show passwords'}
            </button>

            <Button variant="primary" type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]">
              Sign in
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
