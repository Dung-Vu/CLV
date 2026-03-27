'use client';

import { useState } from 'react';

interface ExecuteButtonProps {
  freebieId: string;
  /** Whether the freebie is actually eligible (Tier A, isAutoCandidate) */
  eligible: boolean;
}

interface ExecutionResult {
  success: boolean;
  error?: string;
  stepsLog: string[];
}

export function ExecuteButton({ freebieId, eligible }: ExecuteButtonProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: 'dry_run' | 'semi_auto') {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/freebies/${freebieId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data: ExecutionResult | { error: string } = await res.json();
      if (!res.ok) {
        setError('error' in data ? (data.error ?? 'Execution failed') : 'Execution failed');
      } else {
        setResult(data as ExecutionResult);
      }
    } catch {
      setError('Network error');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Semi-auto Execution
      </h3>

      {!eligible && (
        <p className="text-xs text-yellow-600">
          Deal này không đủ điều kiện auto (cần Tier A + score ≥ 70 + no card/KYC).
        </p>
      )}

      <div className="flex gap-2">
        <button
          disabled={running}
          onClick={() => run('dry_run')}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-300 text-sm font-medium py-2 rounded-lg transition-colors"
        >
          {running ? '⏳ Running…' : '🧪 Dry Run'}
        </button>
        {eligible && (
          <button
            disabled={running}
            onClick={() => run('semi_auto')}
            className="flex-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {running ? '⏳ Running…' : '🚀 Semi-auto'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`border rounded p-3 text-sm space-y-2 ${
            result.success
              ? 'bg-green-950 border-green-800 text-green-300'
              : 'bg-red-950 border-red-800 text-red-300'
          }`}
        >
          <p className="font-semibold">{result.success ? '✅ Success' : '❌ Failed'}</p>
          {result.error && <p className="text-xs opacity-75">{result.error}</p>}
          <ul className="space-y-1">
            {result.stepsLog.map((step, i) => (
              <li key={i} className="text-xs font-mono opacity-80">
                {i + 1}. {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
