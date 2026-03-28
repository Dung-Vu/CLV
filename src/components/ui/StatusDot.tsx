import React from 'react';

export type StatusVariant = 'online' | 'standby' | 'locked' | 'error';

export interface StatusDotProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusVariant;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status, className = '', ...props }) => {
  const getConfig = () => {
    switch (status) {
      case 'online': return { color: 'var(--accent-green)', pulse: true, duration: '2s' };
      case 'standby': return { color: 'var(--accent-yellow)', pulse: true, duration: '3s' };
      case 'locked': return { color: 'var(--bg-surface)', borderColor: 'var(--accent-red)', pulse: false };
      case 'error': return { color: 'var(--accent-red)', pulse: true, duration: '1s' };
      default: return { color: 'var(--text-muted)', pulse: false };
    }
  };

  const { color, borderColor, pulse, duration } = getConfig();

  return (
    <div className={`relative flex h-2.5 w-2.5 shrink-0 ${className}`} {...props}>
      {pulse && (
        <span 
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ backgroundColor: color, animationDuration: duration }}
        ></span>
      )}
      <span 
        className="relative inline-flex rounded-full h-full w-full"
        style={{ 
          backgroundColor: color, 
          border: borderColor ? `2px solid ${borderColor}` : 'none' 
        }}
      ></span>
    </div>
  );
};
