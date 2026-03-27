#!/usr/bin/env tsx
/**
 * Job: Run ingestion once — fetch from all enabled sources and save raw freebies.
 * Usage: npm run ingest:once
 */
import { runIngestionOnce } from '@/modules/ingestion/ingestion.service';
import { logger } from '@/lib/logger';

async function main() {
  logger.info('=== CLV Ingestion Job START ===');
  try {
    const results = await runIngestionOnce();
    const total = results.reduce(
      (acc, r) => ({ created: acc.created + r.created, errors: acc.errors + r.errors }),
      { created: 0, errors: 0 },
    );
    logger.info('=== CLV Ingestion Job DONE ===', total);
    process.exit(0);
  } catch (err) {
    logger.error('Ingestion job failed', { error: err });
    process.exit(1);
  }
}

main();
