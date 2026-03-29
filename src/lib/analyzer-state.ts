export interface AnalyzerState {
  isRunning: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  total: number;
  startedAt: Date | null;
  finishedAt: Date | null;
  error: string | null;
}

const defaultState: AnalyzerState = {
  isRunning: false,
  processed: 0,
  succeeded: 0,
  failed: 0,
  total: 0,
  startedAt: null,
  finishedAt: null,
  error: null,
};

const g = global as unknown as { __analyzerState?: AnalyzerState };

if (!g.__analyzerState) {
  g.__analyzerState = { ...defaultState };
}

export function getAnalyzerState(): Readonly<AnalyzerState> {
  return { ...g.__analyzerState! };
}

export function setAnalyzerRunning(total: number): void {
  const state = g.__analyzerState!;
  state.isRunning = true;
  state.processed = 0;
  state.succeeded = 0;
  state.failed = 0;
  state.total = total;
  state.startedAt = new Date();
  state.finishedAt = null;
  state.error = null;
}

export function updateAnalyzerProgress(succeeded: number, failed: number, processed: number): void {
  const state = g.__analyzerState!;
  state.succeeded = succeeded;
  state.failed = failed;
  state.processed = processed;
}

export function setAnalyzerDone(error?: string): void {
  const state = g.__analyzerState!;
  state.isRunning = false;
  state.finishedAt = new Date();
  state.error = error ?? null;
}
