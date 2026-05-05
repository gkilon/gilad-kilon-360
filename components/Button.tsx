import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm tracking-wide";
  
  const variants = {
    // Primary: Solid Kilon Teal
    primary: "bg-accent-700 hover:bg-accent-600 text-white shadow-md shadow-accent-900/10 border border-transparent active:scale-[0.98]",
    
    // Secondary: Light Gray
    secondary: "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 hover:border-slate-300",
    
    // Outline: White with Teal Border
    outline: "bg-white text-accent-700 border border-accent-700 hover:bg-accent-50 hover:text-accent-800",
    
    // Ghost: Subtle Text
    ghost: "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  };

  const finalClassName = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <button 
      className={finalClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -mr-1 ml-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="mr-2">Processing...</span>
        </>
      ) : children}
    </button>
  );
};