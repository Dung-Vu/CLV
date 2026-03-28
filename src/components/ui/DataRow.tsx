import React from 'react';

export interface DataRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}

export const DataRow: React.FC<DataRowProps> = ({ 
  label, 
  value, 
  valueColor = 'text-[var(--text-primary)]', 
  className = '', 
  ...props 
}) => {
  return (
    <div 
      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0 gap-1 sm:gap-4 ${className}`}
      {...props}
    >
      <span className="font-mono text-xs text-[var(--text-dim)] tracking-wider uppercase shrink-0">
        {label}:
      </span>
      {typeof value === 'string' || typeof value === 'number' ? (
        <span className={`font-mono text-sm sm:text-xs tracking-wide break-words ${valueColor} sm:text-right`}>
          {value}
        </span>
      ) : (
        <div className="sm:text-right w-full sm:w-auto">
          {value}
        </div>
      )}
    </div>
  );
};
