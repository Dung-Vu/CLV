import React from 'react';

export type BadgeVariant = 'tier-a' | 'tier-b' | 'tier-c' | 'category' | 'status' | 'success' | 'danger' | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  let baseClass = "inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold tracking-widest uppercase border ";
  
  switch(variant) {
    case 'tier-a':
      baseClass += "bg-[rgba(0,255,136,0.1)] text-[var(--accent-green)] border-[rgba(0,255,136,0.3)] shadow-[0_0_10px_rgba(0,255,136,0.15)]";
      break;
    case 'tier-b':
      baseClass += "bg-[rgba(245,158,11,0.1)] text-[var(--accent-yellow)] border-[rgba(245,158,11,0.3)]";
      break;
    case 'tier-c':
      baseClass += "bg-[rgba(255,68,68,0.1)] text-[var(--accent-red)] border-[rgba(255,68,68,0.3)]";
      break;
    case 'category':
      baseClass += "bg-[rgba(14,165,233,0.1)] text-[var(--accent-blue)] border-[rgba(14,165,233,0.3)]";
      break;
    case 'status':
      baseClass += "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-active)]";
      break;
    case 'success':
      baseClass += "bg-[rgba(0,255,136,0.2)] text-[var(--accent-green)] border-[var(--accent-green)]";
      break;
    case 'danger':
      baseClass += "bg-[rgba(255,68,68,0.2)] text-[var(--accent-red)] border-[var(--accent-red)]";
      break;
    case 'default':
    default:
      baseClass += "bg-black/40 text-[var(--text-muted)] border-[var(--border-subtle)]";
      break;
  }

  return (
    <span className={`${baseClass} ${className}`} {...props}>
      {children}
    </span>
  );
}
