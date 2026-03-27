import Link from 'next/link';
import { notFound } from 'next/navigation';

import { classifyTier, evaluateExecutionPolicy } from '@/modules/policy/policy.service';
import { getFreebieById } from '@/modules/freebies/freebies.service';
import { ExecuteButton } from './_components/ExecuteButton';
import { FreebieActions } from './_components/FreebieActions';
import { env } from '@/lib/env';

const TIER_BADGE: Record<string, string> = {
  A: 'bg-green-900 text-green-300',
  B: 'bg-yellow-900 text-yellow-300',
  C: 'bg-red-900 text-red-300',
};

const STATUS_BADGE: Record<string, string> = {
  raw: 'bg-zinc-700 text-zinc-300',
  analyzed: 'bg-blue-900 text-blue-300',
  claimed: 'bg-green-900 text-green-300',
  ignored: 'bg-zinc-700 text-zinc-500',
  expired: 'bg-orange-900 text-orange-300',
  analysis_error: 'bg-red-900 text-red-300',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FreebieDetailPage({ params }: PageProps) {
  const { id } = await params;
  const freebie = await getFreebieById(id);

  if (!freebie) notFound();

  const tier = classifyTier({
    eligibleVn: freebie.eligibleVn,
    riskLevel: freebie.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
    cardRequired: freebie.cardRequired,
    kycRequired: freebie.kycRequired,
    frictionLevel: freebie.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
    score: freebie.score,
  });

  const policy = evaluateExecutionPolicy(
    {
      eligibleVn: freebie.eligibleVn,
      riskLevel: freebie.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
      cardRequired: freebie.cardRequired,
      kycRequired: freebie.kycRequired,
      frictionLevel: freebie.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
      score: freebie.score,
      tier,
    },
    env.APP_MODE,
  );

  const isAutoCandidate = policy.isAutoCandidate;

  const steps: string[] = (() => {
    try {
      if (!freebie.stepsJson) return [];
      const parsed: unknown = JSON.parse(freebie.stepsJson);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-zinc-500">
        <Link href="/dashboard/freebies" className="hover:text-zinc-300 transition-colors">
          ← Freebies
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white leading-snug mb-2">{freebie.title}</h1>
          {freebie.url && (
            <a
              href={freebie.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 break-all"
            >
              {freebie.url}
            </a>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_BADGE[freebie.status] ?? 'bg-zinc-700 text-zinc-300'}`}
          >
            {freebie.status}
          </span>
          {freebie.tier && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${TIER_BADGE[freebie.tier] ?? 'bg-zinc-700 text-zinc-300'}`}
            >
              Tier {freebie.tier}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="md:col-span-2 space-y-5">
          {/* Summary */}
          {freebie.summaryVi && (
            <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Tóm tắt
              </h3>
              <p className="text-zinc-200 text-sm leading-relaxed">{freebie.summaryVi}</p>
            </section>
          )}

          {/* Meta grid */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Chi tiết
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <MetaRow label="Nguồn" value={freebie.source ?? '—'} />
              <MetaRow label="Category" value={freebie.category ?? '—'} />
              <MetaRow
                label="Giá trị"
                value={freebie.valueUsd != null ? `$${freebie.valueUsd}` : '—'}
              />
              <MetaRow
                label="Hết hạn"
                value={freebie.expiry ? new Date(freebie.expiry).toLocaleDateString('vi-VN') : '—'}
              />
              <MetaRow label="Risk" value={freebie.riskLevel ?? '—'} />
              <MetaRow label="Friction" value={freebie.frictionLevel ?? '—'} />
              <MetaRow
                label="Cần thẻ"
                value={freebie.cardRequired != null ? (freebie.cardRequired ? 'Yes' : 'No') : '—'}
              />
              <MetaRow
                label="KYC"
                value={freebie.kycRequired != null ? (freebie.kycRequired ? 'Yes' : 'No') : '—'}
              />
              <MetaRow
                label="Eligible VN"
                value={freebie.eligibleVn != null ? (freebie.eligibleVn ? '✅ Yes' : '❌ No') : '—'}
              />
              <MetaRow label="Score" value={freebie.score != null ? String(freebie.score) : '—'} />
            </dl>
          </section>

          {/* Steps */}
          {steps.length > 0 && (
            <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Steps to claim
              </h3>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-300">
                    <span className="text-zinc-600 font-mono text-xs mt-0.5">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Claim Logs */}
          {freebie.claimLogs.length > 0 && (
            <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Lịch sử
              </h3>
              <div className="space-y-3">
                {freebie.claimLogs.map((log) => (
                  <div key={log.id} className="text-sm flex items-start gap-3">
                    <span className="text-zinc-500 text-xs mt-0.5 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </span>
                    <span className="text-zinc-300">
                      <span className="font-medium">{log.status}</span>{' '}
                      <span className="text-zinc-500">via {log.mode}</span>
                      {log.note && <span className="text-zinc-400"> — {log.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: actions */}
        <div className="space-y-4">
          <FreebieActions freebieId={freebie.id} currentStatus={freebie.status} />

          <ExecuteButton freebieId={freebie.id} eligible={isAutoCandidate} />

          {/* Raw content preview */}
          {freebie.description && (
            <details className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-sm">
              <summary className="text-zinc-400 cursor-pointer font-medium">Description</summary>
              <pre className="mt-3 text-zinc-500 text-xs whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {freebie.description.slice(0, 2000)}
                {freebie.description.length > 2000 && '…'}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-200 font-medium">{value}</dd>
    </>
  );
}
