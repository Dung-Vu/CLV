'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { Badge } from '@/components/ui/Badge';
import { ActionButton } from '@/components/ui/ActionButton';
import { toast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface FreebieDetailView {
  id: string;
  title: string;
  status: string;
  tier: string | null;
  score: number | null;
  category: string | null;
  valueUsd: number | null;
  expiry: string | Date | null;
  summaryVi: string | null;
  description: string | null;
  url: string;
  stepsJson: string | null;
}

interface FreebieDetailClientProps {
  freebie: FreebieDetailView;
  breakdown: Record<string, number>;
  explanation: string[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function FreebieDetailClient({ freebie, breakdown, explanation }: FreebieDetailClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [claiming, setClaiming] = useState(false);
  const [ignoring, setIgnoring] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch(`/api/freebies/${freebie.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'claimed' }),
      });
      if (res.ok) {
        toast({ type: 'SUCCESS', title: 'OPERATION COMPLETE', message: 'DEAL CLAIMED ✓' });
        router.push('/freebies');
      } else {
        const error = await res.json();
        toast({
          type: 'ERROR',
          title: 'OPERATION FAILED',
          message: error.error || 'Unknown error',
        });
      }
    } catch (error: unknown) {
      toast({ type: 'ERROR', title: 'NETWORK ERROR', message: getErrorMessage(error) });
    } finally {
      setClaiming(false);
    }
  };

  const handleIgnore = async () => {
    setIgnoring(true);
    try {
      const res = await fetch(`/api/freebies/${freebie.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      });
      if (res.ok) {
        toast({ type: 'INFO', message: 'DEAL IGNORED' });
        router.push('/freebies');
      } else {
        const error = await res.json();
        toast({ type: 'ERROR', title: 'OPERATION FAILED', message: error.error });
      }
    } catch (error: unknown) {
      toast({ type: 'ERROR', title: 'NETWORK ERROR', message: getErrorMessage(error) });
    } finally {
      setIgnoring(false);
    }
  };

  const handleRescore = async () => {
    setRescoring(true);
    try {
      const res = await fetch(`/api/freebies/${freebie.id}/rescore`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        toast({ type: 'INFO', message: `RESCORED: ${freebie.score || 0} → ${data.score}` });
        router.refresh();
      } else {
        const error = await res.json();
        toast({ type: 'ERROR', title: 'OPERATION FAILED', message: error.error });
      }
    } catch (error: unknown) {
      toast({ type: 'ERROR', title: 'NETWORK ERROR', message: getErrorMessage(error) });
    } finally {
      setRescoring(false);
    }
  };

  const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').toUpperCase();

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      {/* HEADER BANNERS */}
      {freebie.tier === 'A' && (
        <div className="bg-[rgba(0,255,136,0.1)] border border-[var(--accent-green)] text-[var(--accent-green)] px-4 py-3 rounded-lg flex items-center justify-center gap-3 font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(0,255,136,0.1)]">
          <ShieldCheck className="w-5 h-5 pointer-events-none" />✓ AUTO-CLAIM CANDIDATE
        </div>
      )}

      {freebie.tier === 'C' && (
        <div className="bg-[rgba(255,68,68,0.1)] border border-[var(--accent-red)] text-[var(--accent-red)] px-4 py-3 rounded-lg flex items-center justify-center gap-3 font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(255,68,68,0.1)]">
          <AlertTriangle className="w-5 h-5 pointer-events-none animate-pulse" />⚠ HIGH RISK —
          MANUAL REVIEW RECOMMENDED
        </div>
      )}

      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <ActionButton
          variant="secondary"
          onClick={() => router.push('/freebies')}
          className="text-xs px-3"
        >
          <ArrowLeft className="w-3 h-3 mr-2" />
          {t('detail.back')}
        </ActionButton>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={freebie.status === 'claimed' ? 'success' : 'status'}>
            {freebie.status.toUpperCase()}
          </Badge>
          {freebie.tier && (
            <Badge
              variant={freebie.tier === 'A' ? 'tier-a' : freebie.tier === 'B' ? 'tier-b' : 'tier-c'}
            >
              TIER {freebie.tier}
            </Badge>
          )}
          <ScoreBadge score={freebie.score || 0} />
        </div>
      </div>

      {/* TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN - ABOUT */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <TerminalCard title="PAYLOAD METADATA" borderColor="var(--border-subtle)">
            <div className="flex flex-col gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-tight">
                {freebie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 border-y border-[var(--border-subtle)] py-3 px-3 -mx-3 bg-black/20">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--text-dim)] uppercase">
                    Category:
                  </span>
                  <Badge variant="category">{freebie.category || t('freebies.unknown')}</Badge>
                </div>
                {freebie.valueUsd && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--text-dim)] uppercase">
                      Value:
                    </span>
                    <span className="font-mono text-sm text-[var(--accent-green)] font-bold">
                      ${freebie.valueUsd}
                    </span>
                  </div>
                )}
                {freebie.expiry && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--text-dim)] uppercase">
                      Expiry:
                    </span>
                    <span className="font-mono text-sm text-[var(--accent-yellow)]">
                      {new Date(freebie.expiry).toISOString().split('T')[0]}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-sm text-[var(--text-muted)] leading-relaxed space-y-4 whitespace-pre-wrap">
                {freebie.summaryVi || freebie.description || 'No description provided.'}
              </div>

              <div className="mt-4">
                <a
                  href={freebie.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[var(--accent-blue)] hover:text-[var(--accent-blue)] hover:drop-shadow-[0_0_10px_rgba(14,165,233,0.5)] transition-all underline underline-offset-4"
                >
                  &gt; {t('detail.openSource')}
                </a>
              </div>
            </div>
          </TerminalCard>

          <TerminalCard title="EXECUTION STEPS" borderColor="var(--border-subtle)">
            <div className="flex flex-col gap-3 font-mono text-sm">
              {freebie.stepsJson ? (
                Array.isArray(JSON.parse(freebie.stepsJson)) ? (
                  JSON.parse(freebie.stepsJson).map((step: string, i: number) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-[var(--accent-green)]">[{i + 1}]</span>
                      <span className="text-[var(--text-primary)]">{step}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[var(--text-primary)]">{freebie.stepsJson}</div>
                )
              ) : (
                <div className="text-[var(--text-dim)] italic">
                  &gt; NO EXECUTION STEPS DETECTED_
                </div>
              )}
            </div>
          </TerminalCard>
        </div>

        {/* RIGHT COLUMN - ANALYSIS */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <TerminalCard title="AI ENGINE ANALYSIS" borderColor="var(--accent-blue)">
            <div className="flex flex-col gap-6">
              {/* Score Breakdown */}
              <div className="flex flex-col gap-3">
                <h3 className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-widest border-b border-[var(--border-subtle)] pb-1">
                  {t('detail.scoreBreakdown')}
                </h3>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  {Object.entries(breakdown).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex flex-col bg-[var(--bg-base)] border border-[var(--border-subtle)] p-2 rounded"
                    >
                      <span className="text-[var(--text-muted)] text-[9px] mb-1 truncate">
                        {formatKey(key)}
                      </span>
                      <span
                        className={`font-bold ${val > 0 ? 'text-[var(--accent-green)]' : val < 0 ? 'text-[var(--accent-red)]' : 'text-[var(--text-dim)]'}`}
                      >
                        {val > 0 ? `+${val}` : val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation List */}
              <div className="flex flex-col gap-2 font-mono text-xs">
                <h3 className="text-[var(--text-dim)] uppercase tracking-widest border-b border-[var(--border-subtle)] pb-1 mb-1">
                  Evaluation Matrix
                </h3>
                {explanation.map((exp, i) => {
                  const isPositive = exp.includes('(+');
                  const isWarning = exp.includes('(-');
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2 ${isPositive ? 'text-[var(--accent-green)]' : isWarning ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {isPositive ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : isWarning ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : (
                          <span className="opacity-50">-</span>
                        )}
                      </span>
                      <span className="leading-snug">{exp}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </TerminalCard>

          {/* ACTIONS */}
          <TerminalCard title="COMMAND INTERFACE" borderColor="var(--accent-yellow)">
            <div className="flex flex-col gap-3">
              {freebie.status !== 'claimed' && (
                <ActionButton
                  variant="primary"
                  fullWidth
                  className="py-3 justify-center mb-2 disabled:opacity-50"
                  onClick={handleClaim}
                  disabled={claiming || ignoring || rescoring}
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <span className="mr-2 inline-block">✓</span>
                  )}
                  MARK AS CLAIMED
                </ActionButton>
              )}

              {freebie.status !== 'ignored' && freebie.status !== 'claimed' && (
                <ActionButton
                  variant="danger"
                  fullWidth
                  className="py-2 justify-center bg-transparent border-[var(--accent-red)] text-[var(--accent-red)] hover:bg-[rgba(255,68,68,0.1)] hover:text-[var(--accent-red)]"
                  onClick={handleIgnore}
                  disabled={claiming || ignoring || rescoring}
                >
                  {ignoring ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  IGNORE DEAL
                </ActionButton>
              )}

              <ActionButton
                variant="secondary"
                fullWidth
                className="py-2 justify-center text-[var(--accent-yellow)] border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.1)] hover:border-[var(--accent-yellow)] transition-all mt-2"
                onClick={handleRescore}
                disabled={claiming || ignoring || rescoring}
              >
                {rescoring ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                ↺ FORCE RESCORE
              </ActionButton>
            </div>
          </TerminalCard>
        </div>
      </div>
    </div>
  );
}
