'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FreebieActionsProps {
  freebieId: string;
  currentStatus: string;
}

export function FreebieActions({ freebieId, currentStatus }: FreebieActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  async function submit(action: 'claimed' | 'ignored') {
    setLoading(true);
    try {
      const res = await fetch(`/api/freebies/${freebieId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Request failed');
      router.refresh();
      setNote('');
    } catch {
      alert('Cập nhật thất bại, thử lại.');
    } finally {
      setLoading(false);
    }
  }

  const isDone = currentStatus === 'claimed' || currentStatus === 'ignored';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Actions</h3>

      {isDone ? (
        <p className="text-zinc-500 text-sm">
          Deal đã được đánh dấu: <span className="text-white font-medium">{currentStatus}</span>
        </p>
      ) : (
        <>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú (tuỳ chọn)..."
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2 mb-4 placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex gap-3">
            <button
              disabled={loading}
              onClick={() => submit('claimed')}
              className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              ✅ Claimed
            </button>
            <button
              disabled={loading}
              onClick={() => submit('ignored')}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-300 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              ✕ Ignored
            </button>
          </div>
        </>
      )}
    </div>
  );
}
