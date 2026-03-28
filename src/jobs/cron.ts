import cron from 'node-cron';
import { cleanupAnalyzedNonDeals } from '@/modules/freebies/freebies.service';
import { supervisorAgent } from '@/modules/agents/supervisor.agent';
import { logger } from '@/lib/logger';

declare global {
  var __cron_registered: boolean | undefined;
}

export function startCronJobs() {
  if (global.__cron_registered) return;
  global.__cron_registered = true;

  // Schedule 1: Supervisor orchestrates the pipeline every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('[CRON] Starting Supervisor Agent');
    try {
      const ctx = { now: new Date(), runType: 'scheduled' as const };
      const result = await supervisorAgent.run(ctx);
      logger.info('[CRON] Supervisor Agent completed', { actions: result.actions });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[CRON] Supervisor Agent failed', { error: message });
    }
  });

  // Schedule 2: Cleanup non-deals once a day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('[CRON] Starting scheduled cleanup');
    try {
      const result = await cleanupAnalyzedNonDeals('auto-cleanup');
      logger.info('[CRON] Cleanup completed', result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[CRON] Cleanup failed', { error: message });
    }
  });

  // Start marker
  logger.info(
    'CLV Cron Runner integrated & started — schedules: supervisor@6h, cleanup@2am'
  );
}
