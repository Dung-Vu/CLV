"use client";

import { AlertTriangle, XCircle, RotateCcw, Search } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";

const ASCII_RADAR = `
    .  .  .    
   . \\ | / .   
  . -- O -- .  
   . / | \\ .   
    .  .  .    
`;

export function EmptyNoFreebies({ onRunIngestion }: { onRunIngestion?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 lg:p-20 border border-[var(--border-subtle)] border-dashed bg-[rgba(0,0,0,0.2)] rounded-lg text-center gap-4">
      <pre className="text-[var(--accent-green)] font-mono text-xs leading-none mb-2 animate-pulse">
        {ASCII_RADAR}
      </pre>
      <div className="font-mono text-[var(--accent-green)] font-bold tracking-widest text-sm md:text-base terminal-cursor">
        &gt; SCANNING FOR FREEBIES...
      </div>
      <p className="text-[var(--text-muted)] font-mono text-xs md:text-sm max-w-md">
        No deals detected. Run ingestion to start hunting.
      </p>
      {onRunIngestion && (
        <ActionButton variant="primary" onClick={onRunIngestion} className="mt-4 shadow-[0_0_15px_rgba(0,255,136,0.15)]">
          ▸ RUN INGESTION
        </ActionButton>
      )}
    </div>
  );
}

export function EmptyNoResults({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-[var(--border-subtle)] bg-[rgba(0,0,0,0.2)] rounded-lg text-center gap-3">
      <Search className="w-8 h-8 text-[var(--text-muted)] mb-2" />
      <div className="font-mono text-[var(--text-dim)] font-bold tracking-widest text-sm terminal-cursor">
        &gt; NO RECORDS MATCH QUERY
      </div>
      <p className="text-[var(--text-muted)] font-mono text-xs">
        Try adjusting filters or expanding search.
      </p>
      {onClearFilters && (
        <ActionButton variant="secondary" onClick={onClearFilters} className="mt-4 border-[var(--text-dim)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-transparent">
          CLEAR FILTERS
        </ActionButton>
      )}
    </div>
  );
}

export function EmptyMissionComplete({ onScan }: { onScan?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 lg:p-16 border border-[var(--accent-green)] bg-[rgba(0,255,136,0.02)] rounded-lg text-center gap-3 shadow-[inset_0_0_50px_rgba(0,255,136,0.05)] text-shadow-sm transition-all hover:bg-[rgba(0,255,136,0.04)]">
      <div className="font-mono text-[var(--accent-green)] font-bold tracking-widest text-sm md:text-base">
        &gt; QUEUE EMPTY. MISSION COMPLETE ✓
      </div>
      <p className="text-[var(--text-muted)] font-mono text-xs md:text-sm">
        All deals have been processed.
      </p>
      {onScan && (
        <ActionButton variant="primary" onClick={onScan} className="mt-5">
          ▸ SCAN FOR NEW DEALS
        </ActionButton>
      )}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-[var(--accent-red)] bg-[rgba(255,68,68,0.05)] rounded-lg text-center gap-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-red)]/50"></div>
      
      <div className="flex items-center gap-3 text-[var(--accent-red)]">
        <XCircle className="w-5 h-5" />
        <div className="font-mono font-bold tracking-widest text-sm">
          &gt; CONNECTION ERROR
        </div>
      </div>
      
      <div className="bg-black/50 border border-[var(--accent-red)]/30 p-3 rounded text-left max-w-lg w-full">
        <code className="text-[var(--accent-red)] font-mono text-[10px] sm:text-xs break-words">
          {error}
        </code>
      </div>
      
      {onRetry && (
        <ActionButton 
          variant="danger" 
          onClick={onRetry} 
          className="mt-2 bg-transparent border-[var(--accent-red)] text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-[var(--bg-base)] hover:shadow-[0_0_15px_rgba(255,68,68,0.4)]"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          ↺ RETRY
        </ActionButton>
      )}
    </div>
  );
}

export function PendingAnalysisState({ count, onRunAnalyzer }: { count: number; onRunAnalyzer?: () => void }) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-6 border border-[var(--accent-yellow)] bg-[rgba(245,158,11,0.05)] rounded-lg gap-5">
      <div className="flex items-center gap-4">
        <AlertTriangle className="w-6 h-6 text-[var(--accent-yellow)] shrink-0" />
        <div className="flex flex-col gap-1.5 text-left">
          <div className="font-mono text-[var(--accent-yellow)] font-bold tracking-widest text-sm terminal-cursor">
            &gt; {count} DEALS PENDING ANALYSIS
          </div>
          <p className="text-[var(--text-muted)] font-mono text-[10px] uppercase">
            Raw ingested data requires AI scoring before classification.
          </p>
        </div>
      </div>
      
      {onRunAnalyzer && (
        <ActionButton 
          variant="secondary" 
          onClick={onRunAnalyzer}
          className="border-[var(--accent-yellow)] text-[var(--accent-yellow)] hover:bg-[var(--accent-yellow)] hover:text-[var(--bg-base)] shadow-[0_0_10px_rgba(245,158,11,0.2)] whitespace-nowrap"
        >
          ▸ RUN ANALYZER NOW
        </ActionButton>
      )}
    </div>
  );
}
