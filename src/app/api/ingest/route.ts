import { NextResponse } from 'next/server';
import { runIngestionOnce } from '@/modules/ingestion/ingestion.service';
import { logger } from '@/lib/logger';

export async function POST() {
  logger.info('Manual ingestion triggered via API');
  try {
    const results = await runIngestionOnce();
    const summary = results.reduce(
      (acc, r) => ({
        sources: acc.sources + 1,
        fetched: acc.fetched + r.fetched,
        created: acc.created + r.created,
        filteredOut: acc.filteredOut + r.filteredOut,
        skipped: acc.skipped + r.skipped,
        errors: acc.errors + r.errors,
      }),
      { sources: 0, fetched: 0, created: 0, filteredOut: 0, skipped: 0, errors: 0 },
    );
    return NextResponse.json({ success: true, summary });
  } catch (err) {
    logger.error('Manual ingestion failed', { error: err });
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}
