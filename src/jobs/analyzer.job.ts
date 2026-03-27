#!/usr/bin/env tsx
/**
 * Job: Run analyzer once — process pending raw freebies with LLM.
 * Usage: npm run analyzer:once
 */
import { analyzePendingFreebies } from '@/modules/analyzer/analyzer.service';
import { logger } from '@/lib/logger';

const BATCH_LIMIT = parseInt(process.env.ANALYZER_BATCH_LIMIT ?? '20', 10);

async function main() {
  logger.info('=== CLV Analyzer Job START ===', { batchLimit: BATCH_LIMIT });
  try {
    const result = await analyzePendingFreebies(BATCH_LIMIT);
    logger.info('=== CLV Analyzer Job DONE ===', result);
    process.exit(0);
  } catch (err) {
    logger.error('Analyzer job failed', { error: err });
    process.exit(1);
  }
}

main();
