import Link from 'next/link';
import { getDashboardStats } from '@/modules/freebies/freebies.service';

const STATUS_LABEL: Record<string, string> = {
  raw: 'Raw',
  analyzed: 'Analyzed',
  claimed: 'Claimed',
  ignored: 'Ignored',
  expired: 'Expired',
  analysis_error: 'Error',
};

const STATUS_COLOR: Record<string, string> = {
  raw: 'bg-zinc-700 text-zinc-200',
  analyzed: 'bg-blue-900 text-blue-200',
  claimed: 'bg-green-900 text-green-200',
  ignored: 'bg-zinc-800 text-zinc-400',
  expired: 'bg-yellow-900 text-yellow-300',
  analysis_error: 'bg-red-900 text-red-300',
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-zinc-500 text-sm mb-8">Tổng quan hệ thống CLV</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {Object.entries(STATUS_LABEL).map(([status, label]) => (
          <div
            key={status}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="text-2xl font-bold text-white">{stats[status] ?? 0}</span>
            <span
              className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full w-fit ${STATUS_COLOR[status] ?? 'bg-zinc-700 text-zinc-300'}`}
            >
              {status}
            </span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/freebies"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            📋 Xem tất cả Freebies ({total})
          </Link>
          <Link
            href="/dashboard/freebies?status=analyzed&minScore=60"
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            ⭐ Deals đáng chú ý (score ≥ 60)
          </Link>
          <Link
            href="/dashboard/freebies?status=analyzed"
            className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            🔍 Chờ review ({stats['analyzed'] ?? 0})
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-zinc-600 mt-4">
        Cập nhật lúc: {new Date().toLocaleString('vi-VN')}
      </div>
    </div>
  );
}
