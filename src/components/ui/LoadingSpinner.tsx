import React from 'react';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  text = 'PROCESSING...', 
  size = 'md',
  className = '', 
  ...props 
}) => {
  
  const getDims = () => {
    switch (size) {
      case 'sm': return 'w-5 h-5';
      case 'lg': return 'w-16 h-16';
      case 'md':
      default: return 'w-8 h-8';
    }
  };

  const getDots = () => {
    switch (size) {
      case 'sm': return 'w-1 h-1';
      case 'lg': return 'w-3 h-3';
      case 'md':
      default: return 'w-2 h-2';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-4 ${className}`} {...props}>
      <div className={`relative flex items-center justify-center ${getDims()}`}>
        <div className="absolute w-full h-full border-2 border-[var(--border-subtle)] rounded-full opacity-30"></div>
        <div className="absolute w-full h-full border-2 border-[var(--accent-green)] rounded-full border-t-transparent animate-spin"></div>
        <div className={`absolute ${getDots()} bg-[var(--accent-green)] rounded-full animate-ping opacity-80`}></div>
      </div>
      {text && (
        <span className="font-mono text-[10px] tracking-widest text-[var(--accent-green)] uppercase animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};
