import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon */}
      <div className={`${sizes[size]} flex-shrink-0`}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" rx="12" fill="url(#logoGrad)" />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="64" y2="64">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <g transform="translate(12, 18)">
            <path
              d="M 5 3 L 35 3 C 37 3 38 4 38 6 L 38 18 C 38 20 37 21 35 21 L 5 21 C 3 21 2 20 2 18 L 2 6 C 2 4 3 3 5 3 Z"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M 12 3 Q 12 -2 20 -2 Q 28 -2 28 3"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.95"
            />
            <circle cx="12" cy="12" r="1.5" fill="#3B82F6" />
            <circle cx="20" cy="12" r="1.5" fill="#3B82F6" />
            <circle cx="28" cy="12" r="1.5" fill="#3B82F6" />
          </g>
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
            IronPress
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 -mt-1">Professional Laundry</span>
          )}
        </div>
      )}
    </div>
  );
};
