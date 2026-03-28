"use client";

import React, { useState, MouseEvent } from "react";

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ variant = 'secondary', fullWidth, icon, children, className = '', onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<{ x: number, y: number, id: number }[]>([]);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { x, y, id }]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== id));
      }, 600);
      
      if (onClick) onClick(e);
    };

    let baseClass = "relative overflow-hidden font-mono text-xs font-bold tracking-widest px-4 py-2 rounded-sm transition-colors flex items-center justify-center gap-2 ";
    
    if (variant === 'primary') {
      baseClass += "bg-[var(--accent-green)] text-black border border-[var(--accent-green)] hover:bg-[#00e67a] ";
    } else if (variant === 'danger') {
      baseClass += "bg-transparent text-[var(--accent-red)] border border-[var(--accent-red)] hover:bg-[rgba(255,68,68,0.1)] ";
    } else {
      baseClass += "bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--text-primary)] ";
    }

    if (fullWidth) baseClass += "w-full ";

    const rippleColor = variant === 'primary' ? 'rgba(0,0,0,0.2)' : 'rgba(0,255,136,0.3)';

    return (
      <button 
        ref={ref} 
        className={`${baseClass} ${className}`} 
        onClick={handleClick}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2 pointer-events-none">
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </span>
        
        {ripples.map(r => (
          <span 
            key={r.id}
            className="absolute rounded-full animate-ripple pointer-events-none z-0"
            style={{
              left: r.x,
              top: r.y,
              width: 10,
              height: 10,
              backgroundColor: rippleColor,
            }}
          />
        ))}
      </button>
    );
  }
);
ActionButton.displayName = 'ActionButton';
