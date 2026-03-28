import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  getAnalyzerState,
  setAnalyzerDone,
  setAnalyzerRunning,
  updateAnalyzerProgress,
} from '@/lib/analyzer-state';
import { analyzeFreebieOnce } from '@/modules/analyzer/analyzer.service';
import { prisma } from '@/lib/db';

async function countRawFreebies(): Promise<number> {
  return prisma.freebie.count({ where: { status: 'raw' } });
}

async function runAnalyzerBackground(): Promise<void> {
  let succeeded = 0;
  let failed = 0;
  let processed = 0;

  try {
    while (true) {
      const batch = await prisma.freebie.findMany({
        where: { status: 'raw' },
        take: 5,
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (batch.length === 0) break;

      const results = await Promise.all(
        batch.map(async (item) => await analyzeFreebieOnce(item.id))
      );

      for (const ok of results) {
        processed++;
        if (ok) succeeded++;
        else failed++;
      }
      updateAnalyzerProgress(succeeded, failed, processed);
    }

    logger.info('Analyzer background run complete', { processed, succeeded, failed });
    setAnalyzerDone();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Analyzer background run failed', { error: message });
    setAnalyzerDone(message);
  }
}

export async function POST() {
  const current = getAnalyzerState();

  if (current.isRunning) {
    return NextResponse.json({ error: 'Already running' }, { status: 409 });
  }

  const total = await countRawFreebies();

  if (total === 0) {
    return NextResponse.json({ message: 'No pending items', total: 0 });
  }

  setAnalyzerRunning(total);
  logger.info('Analyzer started via API', { total });

  // Fire-and-forget — do NOT await
  void runAnalyzerBackground();

  return NextResponse.json({ message: 'Analyzer started', total }, { status: 202 });
}
