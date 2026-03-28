import React from "react";

export function TerminalLoader({ text = "FETCHING DATA", className = "" }: { text?: string, className?: string }) {
  return (
    <div className={`flex items-center gap-2 font-mono text-sm text-[var(--accent-green)] font-bold tracking-widest ${className}`}>
      <span className="animate-pulse">▸</span> <span className="terminal-cursor">{text}...</span>
    </div>
  );
}

export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-sm ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_linear] bg-gradient-to-r from-transparent via-[var(--bg-elevated)] to-transparent opacity-60" />
    </div>
  );
}
