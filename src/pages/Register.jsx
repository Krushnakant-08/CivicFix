import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

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

  const handleChange = (e) => {
    clearError();
    setLocalError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
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
      // Error is set in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300';

  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-12 px-4 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 md:p-10 relative overflow-hidden animate-slide-up rounded-3xl shadow-xl border border-slate-100">
        {/* Decorative blurs */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-teal-100 rounded-full blur-3xl -z-10 animate-float"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }}></div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Join CivicFix</h2>
          <p className="text-slate-500 mt-2">Create your citizen account and make a difference</p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3 animate-slide-up">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {displayError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Full Name</label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Email</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Phone (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Confirm</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {/* Show password toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Show passwords
          </label>

          <Button
            variant="primary"
            type="submit"
            className="w-full mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Footer links */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
