import Link from 'next/link';
import { listFreebies } from '@/modules/freebies/freebies.service';
import type { DealTier, FreebieStatus } from '@/types';
import { FreebieFilters } from './_components/FreebieFilters';

const TIER_BADGE: Record<string, string> = {
  A: 'bg-green-800 text-green-200',
  B: 'bg-yellow-800 text-yellow-200',
  C: 'bg-zinc-700 text-zinc-400',
};

const STATUS_BADGE: Record<string, string> = {
  raw: 'bg-zinc-700 text-zinc-300',
  analyzed: 'bg-blue-800 text-blue-200',
  claimed: 'bg-green-800 text-green-200',
  ignored: 'bg-zinc-700 text-zinc-500',
  expired: 'bg-yellow-800 text-yellow-300',
  analysis_error: 'bg-red-800 text-red-300',
};

const RISK_BADGE: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
  unknown: 'text-zinc-500',
};

const VALID_STATUSES: FreebieStatus[] = [
  'raw',
  'analyzed',
  'claimed',
  'ignored',
  'expired',
  'analysis_error',
];
const VALID_TIERS: DealTier[] = ['A', 'B', 'C'];

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function FreebiesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const status = VALID_STATUSES.includes(params.status as FreebieStatus)
    ? (params.status as FreebieStatus)
    : undefined;
  const tier = VALID_TIERS.includes(params.tier as DealTier)
    ? (params.tier as DealTier)
    : undefined;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const result = await listFreebies({
    status,
    tier,
    category: params.category,
    minScore: params.minScore ? parseFloat(params.minScore) : undefined,
    search: params.search,
    page,
    pageSize: 25,
  });

  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Freebies</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{result.total} deals</p>
        </div>
      </div>

      <FreebieFilters />

      {result.items.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <p className="text-4xl mb-3">📭</p>
          <p>Không có freebie nào phù hợp.</p>
          <p className="text-sm mt-1">Thử reset filter hoặc chạy Ingest để lấy dữ liệu mới.</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-4">Title</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Source</th>
                <th className="text-center py-3 px-4">Tier</th>
                <th className="text-center py-3 px-4">Score</th>
                <th className="text-center py-3 px-4 hidden lg:table-cell">Risk</th>
                <th className="text-center py-3 px-4 hidden lg:table-cell">🇻🇳</th>
                <th className="text-center py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((f) => (
                <tr
                  key={f.id}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-3 px-4 max-w-xs">
                    <Link
                      href={`/dashboard/freebies/${f.id}`}
                      className="text-blue-400 hover:text-blue-300 line-clamp-2 leading-snug"
                    >
                      {f.title}
                    </Link>
                    {f.valueUsd && (
                      <span className="text-xs text-green-500 ml-0 block">
                        ~${f.valueUsd.toFixed(0)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell text-zinc-500 text-xs">
                    {f.source}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {f.tier ? (
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${TIER_BADGE[f.tier] ?? 'bg-zinc-700 text-zinc-300'}`}
                      >
                        {f.tier}
                      </span>
                    ) : (
                      <span className="text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-mono font-bold ${f.score >= 70 ? 'text-green-400' : f.score >= 50 ? 'text-yellow-400' : 'text-zinc-500'}`}
                    >
                      {Math.round(f.score)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center hidden lg:table-cell">
                    <span className={`text-xs ${RISK_BADGE[f.riskLevel] ?? 'text-zinc-500'}`}>
                      {f.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center hidden lg:table-cell">
                    {f.eligibleVn ? '✅' : '❌'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[f.status] ?? 'bg-zinc-700 text-zinc-300'}`}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
              className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors"
            >
              ← Trước
            </Link>
          )}
          <span className="text-sm text-zinc-500 px-4 py-2">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
              className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors"
            >
              Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
