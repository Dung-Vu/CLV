import React from 'react';

export interface TerminalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  borderColor?: string;
  glowOnHover?: boolean;
}

export function TerminalCard({ 
  title, 
  children, 
  className = '', 
  borderColor = 'var(--border-active)',
  glowOnHover = false,
  ...props 
}: TerminalCardProps) {
  
  const hoverClass = glowOnHover 
    ? "transition-transform duration-150 ease-out hover:-translate-y-[2px] shadow-sm hover:shadow-[0_4px_20px_rgba(0,255,136,0.1)] group/card" 
    : "shadow-sm";

  return (
    <div 
      className={`flex flex-col bg-[var(--bg-surface)] border border-[var(--border-subtle)] border-l-[3px] rounded-sm relative overflow-visible ${hoverClass} ${className}`}
      style={{ borderLeftColor: borderColor }}
      {...props}
    >
      {/* Absolute glow overlay catching the hover context to swap left border to green */}
      {glowOnHover && (
        <div className="absolute top-[-1px] left-[-3px] bottom-[-1px] w-[3px] bg-[var(--accent-green)] opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 pointer-events-none rounded-l-sm z-30" />
      )}
      
      {title && (
        <div className="px-3 sm:px-4 py-2 border-b border-[var(--border-subtle)] bg-[rgba(0,0,0,0.2)] relative z-20">
          <h2 className="font-mono text-xs font-bold tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-2">
            <span style={{ color: borderColor }}>▸</span> {title}
          </h2>
        </div>
      )}
      <div className="p-3 sm:p-4 flex-1 flex flex-col relative z-20 bg-[var(--bg-surface)]">
        {children}
      </div>
    </div>
  );
}
