'use client';

import { TerminalCard } from "@/components/ui/TerminalCard";

interface PipelineStats {
  raw: number;
  analyzed: number;
  ignored: number;
  error: number;
  claimed: number;
}

export function PipelineWidget({ pipeline }: { pipeline: PipelineStats }) {
  const handleRawClick = () => {
    if (pipeline.raw > 0) {
      document.getElementById('quick-actions-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.dispatchEvent(new Event('highlight-analyzer'));
    }
  };

  return (
    <TerminalCard title="PIPELINE STATUS" borderColor="var(--accent-blue)">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full h-full gap-2 p-2">
        
        {/* RAW */}
        <div 
          onClick={handleRawClick}
          className={`flex flex-col items-center justify-center p-4 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] w-full sm:w-1/4 select-none ${
            pipeline.raw > 0 
              ? 'animate-pulse cursor-pointer hover:border-[var(--accent-yellow)] transition-colors' 
              : ''
          }`}
        >
          <span className="font-mono text-xs text-[var(--text-muted)] tracking-widest uppercase mb-2">RAW</span>
          <span className={`font-mono text-3xl font-light ${pipeline.raw > 0 ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-primary)]'}`}>
            [{pipeline.raw}]
          </span>
          <div className={`flex items-center gap-1 mt-2 text-[10px] items-center font-mono ${pipeline.raw > 0 ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-dim)]'}`}>
            🟡 pending
          </div>
        </div>

        <span className="text-[var(--text-dim)] hidden sm:block font-mono">→</span>
        
        {/* ANALYZED */}
        <div className="flex flex-col items-center justify-center p-4 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] w-full sm:w-1/4">
          <span className="font-mono text-xs text-[var(--text-muted)] tracking-widest uppercase mb-2">ANALYZED</span>
          <span className="font-mono text-3xl font-light text-[var(--accent-blue)]">
            [{pipeline.analyzed}]
          </span>
          <div className="flex items-center gap-1 mt-2 text-[10px] items-center text-[var(--accent-blue)] font-mono">
            ✅ done
          </div>
        </div>

        <span className="text-[var(--text-dim)] hidden sm:block font-mono">→</span>

        {/* IGNORED */}
        <div className="flex flex-col items-center justify-center p-4 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] w-full sm:w-1/4">
          <span className="font-mono text-xs text-[var(--text-muted)] tracking-widest uppercase mb-2">IGNORED</span>
          <span className="font-mono text-3xl font-light text-[var(--text-primary)]">
            [{pipeline.ignored}]
          </span>
          <div className="flex items-center gap-1 mt-2 text-[10px] items-center text-[var(--text-muted)] font-mono">
            ⚫ filtered
          </div>
        </div>

        <span className="text-[var(--text-dim)] hidden sm:block font-mono">→</span>

        {/* ERROR */}
        <div className="flex flex-col items-center justify-center p-4 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] w-full sm:w-1/4">
          <span className="font-mono text-xs text-[var(--text-muted)] tracking-widest uppercase mb-2">ERROR</span>
          <span className={`font-mono text-3xl font-light ${pipeline.error > 0 ? 'text-[var(--accent-red)]' : 'text-[var(--text-primary)]'}`}>
            [{pipeline.error}]
          </span>
          <div className={`flex items-center gap-1 mt-2 text-[10px] items-center font-mono ${pipeline.error > 0 ? 'text-[var(--accent-red)] font-bold px-1.5 py-0.5 bg-[rgba(239,68,68,0.1)] rounded' : 'text-[var(--text-dim)]'}`}>
            {pipeline.error > 0 ? '🔴 failed' : '⚪ no errors'}
          </div>
        </div>

      </div>
    </TerminalCard>
  );
}
