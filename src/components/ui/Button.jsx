import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 py-3 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55 active:translate-y-px';

  const variants = {
    primary:
      'bg-[var(--ink)] text-white hover:bg-[#33322e]',
    secondary:
      'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]',
    ghost:
      'text-[var(--text)] hover:bg-[var(--surface-muted)]',
    danger:
      'bg-red-700 text-white hover:bg-red-800',
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;
