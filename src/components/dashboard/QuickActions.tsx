'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ActionButton } from '@/components/ui/ActionButton';
import { toast } from '@/hooks/useToast';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

type AnalyzerButtonState = 'idle' | 'running' | 'done';

interface AnalyzerStatus {
  isRunning: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  total: number;
  error: string | null;
}

export function QuickActions() {
  const router = useRouter();
  const [ingestionLoading, setIngestionLoading] = useState(false);
  const [rescoreLoading, setRescoreLoading] = useState(false);

  // Analyzer state
  const [analyzerBtnState, setAnalyzerBtnState] = useState<AnalyzerButtonState>('idle');
  const [analyzerProgress, setAnalyzerProgress] = useState({ processed: 0, total: 0 });
  const [analyzerHighlighted, setAnalyzerHighlighted] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingProcessedRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/analyze/status');
        if (!res.ok) return;
        const status: AnalyzerStatus = await res.json();

        if (pollingProcessedRef.current !== status.processed && status.isRunning) {
          pollingProcessedRef.current = status.processed;
          router.refresh();
        }
        setAnalyzerProgress({ processed: status.processed, total: status.total });

        if (!status.isRunning) {
          stopPolling();
          setAnalyzerBtnState('done');

          if (status.error) {
            toast({ type: 'ERROR', title: 'ANALYZER FAILED', message: status.error });
          } else {
            toast({
              type: 'SUCCESS',
              title: 'ANALYSIS COMPLETE',
              message: `✓ ${status.succeeded} succeeded · ${status.failed} failed`,
            });
            router.refresh();
          }

          // Flash done then back to idle after 3s
          setTimeout(() => setAnalyzerBtnState('idle'), 3000);
        }
      } catch {
        // polling errors are non-fatal
      }
    }, 2000);
  }, [stopPolling, router]);

  useEffect(() => {
    const onHighlight = () => {
      setAnalyzerHighlighted(true);
      setTimeout(() => setAnalyzerHighlighted(false), 2000);
    };
    window.addEventListener('highlight-analyzer', onHighlight);
    
    return () => {
      stopPolling();
      window.removeEventListener('highlight-analyzer', onHighlight);
    };
  }, [stopPolling]);

  const handleRunAnalyzer = async () => {
    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      const data = await res.json();

      if (res.status === 409) {
        toast({ type: 'INFO', message: 'Analyzer is already running' });
        setAnalyzerBtnState('running');
        startPolling();
        return;
      }

      if (!res.ok) {
        toast({ type: 'ERROR', title: 'ANALYZER ERROR', message: data.error || 'Unknown error' });
        return;
      }

      if (data.total === 0) {
        toast({ type: 'INFO', title: 'NOTHING TO DO', message: 'No pending items to analyze' });
        return;
      }

      setAnalyzerProgress({ processed: 0, total: data.total });
      setAnalyzerBtnState('running');
      startPolling();
    } catch (error: unknown) {
      toast({ type: 'ERROR', title: 'NETWORK ERROR', message: getErrorMessage(error) });
    }
  };

  const handleRunIngestion = async () => {
    setIngestionLoading(true);
    try {
      const res = await fetch('/api/ingest', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        toast({ type: 'ERROR', title: 'INGESTION ERROR', message: data.error || 'Unknown error' });
        return;
      }

      const { summary } = data;
      const msg = summary
        ? `${summary.fetched} fetched · ${summary.created} saved · ${summary.filteredOut} filtered · ${summary.skipped} skipped`
        : 'Ingestion complete';

      toast({ type: 'SUCCESS', title: 'INGESTION COMPLETE', message: msg });
      router.refresh();
    } catch (error: unknown) {
      toast({ type: 'ERROR', title: 'NETWORK ERROR', message: getErrorMessage(error) });
    } finally {
      setIngestionLoading(false);
    }
  };

  const handleRunRescore = async () => {
    setRescoreLoading(true);
    try {
      const res = await fetch('/api/freebies/rescore-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast({
          type: 'SUCCESS',
          title: 'OPERATION COMPLETE',
          message: `RESCORING DONE · ${data.updated} deals updated`,
        });
        router.refresh();
      } else {
        toast({ type: 'ERROR', title: 'OPERATION FAILED', message: data.error || 'Unknown error' });
      }
    } catch (error: unknown) {
      toast({ type: 'ERROR', title: 'NETWORK ERROR', message: getErrorMessage(error) });
    } finally {
      setRescoreLoading(false);
    }
  };

  const analyzerLabel = () => {
    if (analyzerBtnState === 'running') {
      return analyzerProgress.total > 0
        ? `⟳ ANALYZING... ${analyzerProgress.processed} / ${analyzerProgress.total}`
        : '⟳ ANALYZING...';
    }
    if (analyzerBtnState === 'done') return '✓ COMPLETE';
    return 'RUN ANALYZER';
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
        disabled={analyzerBtnState === 'running'}
        className={`py-4 justify-center transition-all duration-300 group border-[rgba(14,165,233,0.3)] text-[var(--accent-blue)] hover:border-[var(--accent-blue)] hover:bg-[rgba(14,165,233,0.05)] hover:text-[var(--accent-blue)] hover:shadow-[0_0_15px_rgba(14,165,233,0.1)] ${analyzerBtnState === 'done' ? 'border-[var(--accent-green)] text-[var(--accent-green)]' : ''} ${analyzerHighlighted ? 'ring-4 ring-[var(--accent-yellow)] ring-opacity-50 !border-[var(--accent-yellow)] !text-[var(--accent-yellow)] animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)]' : ''}`}
      >
        {analyzerBtnState === 'running' ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 mr-2 shrink-0" />
            <span className="font-mono text-xs">{analyzerLabel()}</span>
          </>
        ) : (
          <>
            <span
              className={`${analyzerBtnState === 'done' ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'} transition-opacity mr-2`}
            >
              {analyzerBtnState === 'done' ? '✓' : '▸'}
            </span>
            {analyzerLabel()}
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
