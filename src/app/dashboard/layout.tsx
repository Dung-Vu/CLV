import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-zinc-800 bg-zinc-900 px-6 py-3 flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-bold text-white tracking-tight">
          🎯 CLV
        </Link>
        <Link
          href="/dashboard/freebies"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Freebies
        </Link>
        <div className="ml-auto flex gap-3">
          <form action="/api/ingest" method="POST">
            <button
              type="submit"
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors"
            >
              ↓ Ingest
            </button>
          </form>
          <form action="/api/analyze" method="POST">
            <button
              type="submit"
              className="text-xs bg-blue-900 hover:bg-blue-800 text-blue-200 px-3 py-1.5 rounded transition-colors"
            >
              ⚡ Analyze
            </button>
          </form>
        </div>
      </nav>
      <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
