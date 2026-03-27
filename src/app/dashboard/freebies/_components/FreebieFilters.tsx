'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

const STATUSES = ['raw', 'analyzed', 'claimed', 'ignored', 'expired', 'analysis_error'];
const CATEGORIES = ['ai-tool', 'saas', 'cloud', 'voucher', 'other'];
const TIERS = ['A', 'B', 'C'];

export function FreebieFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete('page'); // reset pagination on filter change
      router.push(`${pathname}?${next.toString()}`);
    },
    [router, pathname, params],
  );

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {/* Search */}
      <input
        type="search"
        placeholder="Tìm kiếm title / source..."
        defaultValue={params.get('search') ?? ''}
        onChange={(e) => update('search', e.target.value)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-3 py-2 w-64 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
      />

      {/* Status */}
      <select
        defaultValue={params.get('status') ?? ''}
        onChange={(e) => update('status', e.target.value)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        <option value="">Tất cả status</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Tier */}
      <select
        defaultValue={params.get('tier') ?? ''}
        onChange={(e) => update('tier', e.target.value)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        <option value="">Tất cả Tier</option>
        {TIERS.map((t) => (
          <option key={t} value={t}>
            Tier {t}
          </option>
        ))}
      </select>

      {/* Category */}
      <select
        defaultValue={params.get('category') ?? ''}
        onChange={(e) => update('category', e.target.value)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        <option value="">Tất cả category</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Min score */}
      <select
        defaultValue={params.get('minScore') ?? ''}
        onChange={(e) => update('minScore', e.target.value)}
        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        <option value="">Score tối thiểu</option>
        <option value="40">≥ 40</option>
        <option value="60">≥ 60</option>
        <option value="70">≥ 70</option>
        <option value="80">≥ 80</option>
      </select>

      {/* Reset */}
      {params.size > 0 && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2 transition-colors"
        >
          ✕ Reset filter
        </button>
      )}
    </div>
  );
}
