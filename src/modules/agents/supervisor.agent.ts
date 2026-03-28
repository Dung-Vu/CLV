import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { sendPipelineAlert, sendTelegramMessage, formatTierAAlert } from '@/lib/integrations/telegram';
import { getDashboardStats, getEstimatedClaimableValue, getNewTierADeals } from '@/modules/freebies/freebies.service';
import { runIngestionOnce } from '@/modules/ingestion/ingestion.service';
import { analyzePendingFreebies } from '@/modules/analyzer/analyzer.service';
import { researchAgent } from './research.agent';
import type { Agent, AgentContext, AgentResult } from './agent.types';

const supervisorAgent: Agent = {
  name: 'SupervisorAgent',
  get enabled() { return env.AGENT_SUPERVISOR_ENABLED; },

  async run(ctx: AgentContext): Promise<AgentResult> {
    void ctx;
    const actions: string[] = [];
    const log = (msg: string) => { actions.push(msg); };
    const start = Date.now();

    logger.info('run started', { agent: 'SupervisorAgent' });

    try {
      // Find last successful run
      const lastRun = await prisma.agentRunLog.findFirst({
        where: { agentName: 'SupervisorAgent', status: 'success' },
        orderBy: { startedAt: 'desc' },
      });
      const lastRunAt = lastRun?.startedAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Step 1: Get initial stats
      let stats = await getDashboardStats();
      const initialRaw = stats['raw'] ?? 0;
      
      log(`Stats: raw=${initialRaw}, errors=${stats['analysis_error'] ?? 0}`);

      // Step 2: Research if raw is low
      if (initialRaw < 10) {
        await researchAgent.run(ctx);
        await runIngestionOnce();
        log('Triggered: ingestion + research (low raw backlog)');
        // Update stats after ingestion
        stats = await getDashboardStats();
      }

      // Step 3: Analyze if there are raw items
      const currentRaw = stats['raw'] ?? 0;
      if (currentRaw > 0) {
        const result = await analyzePendingFreebies(20);
        log(`Triggered: analyzer → ${result.succeeded} succeeded`);
      }

      // Step 4: Alert for Tier A deals discovered after lastRunAt
      const newTierA = await getNewTierADeals(lastRunAt);
      if (newTierA.length > 0) {
        await sendTelegramMessage(formatTierAAlert(newTierA));
        log(`Alerted: ${newTierA.length} new Tier A deals`);
      }

      // Step 5: Pipeline alert on anomalies
      const errors = stats['analysis_error'] ?? 0;
      if (errors > 5) {
        const estimatedValue = await getEstimatedClaimableValue();
        await sendPipelineAlert({
          errorCount: errors,
          rawBacklog: currentRaw,
          estimatedValue,
        });
        log(`Alerted: anomaly detected (${errors} analysis errors)`);
      }

      // Record successful run
      await prisma.agentRunLog.create({
        data: {
          agentName: 'SupervisorAgent',
          status: 'success',
          actions,
          startedAt: new Date(start),
          finishedAt: new Date(),
        }
      });

      logger.info('run finished', { agent: 'SupervisorAgent', actionsCount: actions.length });
    } catch (error) {
      logger.error('SupervisorAgent failed', { error: String(error) });
      
      await prisma.agentRunLog.create({
        data: {
          agentName: 'SupervisorAgent',
          status: 'error',
          actions,
          error: String(error),
          startedAt: new Date(start),
          finishedAt: new Date(),
        }
      });
    }

    return { name: 'SupervisorAgent', actions };
  },
};

export { supervisorAgent };
