import { loadEnvFile } from 'node:process';

loadEnvFile('.env');

async function main() {
  await import('@/lib/env');
  const { logger } = await import('@/lib/logger');
  const { cleanupAnalyzedNonDeals } = await import('@/modules/freebies/freebies.service');
  const note = 'Auto-cleanup: not a deal';

  logger.info('cleanup-non-deals started', { note });

  const result = await cleanupAnalyzedNonDeals(note);

  logger.info('cleanup-non-deals finished', { cleaned: result.cleaned });
}

main().catch((error) => {
  logger.error('cleanup-non-deals fatal error', {
    error: error instanceof Error ? error.message : error,
  });
  process.exit(1);
});