import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary:
      'bg-emerald-800 hover:bg-emerald-700 text-[#fdf8ef] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:ring-offset-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ease-in-out',
    secondary:
      'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-soft)] hover:border-[var(--accent-forest)] hover:shadow-[var(--shadow-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-ocean)]/20 focus:ring-offset-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ease-in-out',
  };

  return (
    <button className={`${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;
