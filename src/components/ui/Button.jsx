import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: "btn-gradient",
    secondary: "bg-white text-slate-800 border border-slate-200 hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out"
  };

  return (
    <button 
      className={`${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
