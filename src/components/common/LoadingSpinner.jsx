import React from 'react';

/**
 * Enhanced loading spinner component with pulse effect
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (sm, md, lg)
 * @param {string} props.color - Color of the spinner
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.label - Optional label to display under the spinner
 * @returns {JSX.Element} - Rendered component
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  label = ''
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  // Color classes
  const colorClasses = {
    indigo: 'text-indigo-500',
    blue: 'text-blue-600',
    gray: 'text-gray-500',
    white: 'text-white'
  };
  
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const spinnerColor = colorClasses[color] || colorClasses.blue;
  
  return (
    <div className={`flex flex-col justify-center items-center ${className}`}>
      <div className="relative">
        {/* Pulse effect background */}
        <div className={`absolute inset-0 rounded-full ${spinnerColor.replace('text-', 'bg-').replace('-500', '-100').replace('-600', '-100')} animate-pulse`}></div>
        
        {/* Spinner */}
        <svg 
          className={`relative animate-spin ${spinnerSize} ${spinnerColor}`} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      
      {/* Optional label */}
      {label && (
        <span className={`mt-2 text-sm font-medium ${spinnerColor}`}>{label}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
