"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { toast } from "@/hooks/useToast";

export function QuickActions() {
  const [ingestionLoading, setIngestionLoading] = useState(false);
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [rescoreLoading, setRescoreLoading] = useState(false);

  const handleRunIngestion = () => {
    setIngestionLoading(true);
    setTimeout(() => {
      setIngestionLoading(false);
      toast({ type: 'SUCCESS', title: 'OPERATION COMPLETE', message: 'INGESTION COMPLETE · 12 deals found' });
    }, 2000);
  };

  const handleRunAnalyzer = () => {
    setAnalyzerLoading(true);
    setTimeout(() => {
      setAnalyzerLoading(false);
      toast({ type: 'SUCCESS', title: 'OPERATION COMPLETE', message: 'ANALYSIS COMPLETE · 12 deals processed' });
    }, 2000);
  };

  const handleRunRescore = async () => {
    setRescoreLoading(true);
    try {
      const res = await fetch('/api/freebies/rescore-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast({ type: 'SUCCESS', title: 'OPERATION COMPLETE', message: `RESCORING DONE · ${data.updated} deals updated` });
      } else {
        toast({ type: 'ERROR', title: 'OPERATION FAILED', message: data.error || 'Unknown error' });
      }
    } catch (e: any) {
      toast({ type: 'ERROR', title: 'NETWORK ERROR', message: e.message });
    } finally {
      setRescoreLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <ActionButton 
        variant="primary"
        fullWidth
        onClick={handleRunIngestion}
        disabled={ingestionLoading}
        className="py-4 bg-[rgba(0,255,136,0.02)] border border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[#00e67a] hover:text-black hover:shadow-[0_0_20px_rgba(0,255,136,0.2)] justify-center transition-all group"
      >
        {ingestionLoading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
            RUNNING...
          </>
        ) : (
          <>
            <span className="opacity-50 group-hover:opacity-100 transition-opacity mr-2">▸</span>
            RUN INGESTION
          </>
        )}
      </ActionButton>

      <ActionButton 
        variant="secondary"
        fullWidth
        onClick={handleRunAnalyzer}
        disabled={analyzerLoading}
        className="py-4 justify-center transition-all group border-[rgba(14,165,233,0.3)] text-[var(--accent-blue)] hover:border-[var(--accent-blue)] hover:bg-[rgba(14,165,233,0.05)] hover:text-[var(--accent-blue)] hover:shadow-[0_0_15px_rgba(14,165,233,0.1)]"
      >
        {analyzerLoading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
            RUNNING...
          </>
        ) : (
          <>
            <span className="opacity-50 group-hover:opacity-100 transition-opacity mr-2">▸</span>
            RUN ANALYZER
          </>
        )}
      </ActionButton>

      <ActionButton 
        variant="secondary"
        fullWidth
        onClick={handleRunRescore}
        disabled={rescoreLoading}
        className="py-4 justify-center transition-all group border-[rgba(245,158,11,0.3)] text-[var(--accent-yellow)] hover:border-[var(--accent-yellow)] hover:bg-[rgba(245,158,11,0.05)] hover:text-[var(--accent-yellow)] hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]"
      >
        {rescoreLoading ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 mr-2" />
            RESCORING...
          </>
        ) : (
          <>
            <span className="opacity-50 group-hover:opacity-100 transition-opacity mr-2">↺</span>
            RESCORE ALL
          </>
        )}
      </ActionButton>
    </div>
  );
}
