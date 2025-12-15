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
  
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  
  const variants = {
    // Gradient Blue
    primary: "bg-gradient-to-r from-primary-700 to-primary-900 hover:from-primary-800 hover:to-primary-950 text-white shadow-primary-500/30 hover:shadow-md",
    
    // Light Blue
    secondary: "bg-white text-primary-700 border border-primary-200 hover:border-primary-400 hover:bg-primary-50",
    
    // Outline Blue
    outline: "bg-transparent text-primary-700 border border-primary-300 hover:border-primary-600 hover:text-primary-900",
    
    // Ghost
    ghost: "bg-transparent text-primary-500 hover:text-primary-800 shadow-none hover:bg-primary-50"
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
          <span className="mr-2">טוען...</span>
        </>
      ) : children}
    </button>
  );
};