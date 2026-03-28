import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { sendPipelineAlert } from '@/lib/integrations/telegram';
import { getDashboardStats, getEstimatedClaimableValue } from '@/modules/freebies/freebies.service';
import type { Agent, AgentContext, AgentResult } from './agent.types';

/**
 * SupervisorAgent — reads daily stats and produces a concise summary +
 * recommendations (priority boosts, frequency hints).
 *
 * Orchestration only: no direct DB access, no Playwright, no LLM calls.
 * Delegates data reads to freebies service functions.
 */
const supervisorAgent: Agent = {
  name: 'SupervisorAgent',
  get enabled() { return env.AGENT_SUPERVISOR_ENABLED; },

  async run(ctx: AgentContext): Promise<AgentResult> {
    void ctx;
    const actions: string[] = [];
    const log = (msg: string) => { actions.push(msg); };

    logger.info('run started', { agent: 'SupervisorAgent' });

    // 1. Gather stats via service layer
    const [byStatus, estimatedValue] = await Promise.all([
      getDashboardStats(),
      getEstimatedClaimableValue(),
    ]);

    const recentErrors = byStatus['analysis_error'] ?? 0;

    log(
      `Stats: raw=${byStatus['raw'] ?? 0} analyzed=${byStatus['analyzed'] ?? 0} ` +
        `claimed=${byStatus['claimed'] ?? 0} ignored=${byStatus['ignored'] ?? 0} ` +
        `errors=${recentErrors}`,
    );
    log(`Estimated claimable value: $${estimatedValue.toFixed(0)}`);

    // 2. Simple rule-based recommendations
    const rawCount = byStatus['raw'] ?? 0;
    const analyzedCount = byStatus['analyzed'] ?? 0;

    if (rawCount > 20) {
      log('RECOMMENDATION: High raw backlog — suggest increasing analyzer batch size');
    } else if (rawCount === 0 && analyzedCount === 0) {
      log('RECOMMENDATION: Pipeline appears idle — suggest running ingestion');
    } else {
      log('RECOMMENDATION: Pipeline looks healthy');
    }

    if (recentErrors > 5) {
      log(
        `ALERT: ${recentErrors} analysis errors detected — consider checking LLM quota or prompt`,
      );
    }

    // 3. Telegram alert for anomalies
    if (recentErrors > 5 || rawCount > 50) {
      await sendPipelineAlert({
        errorCount: recentErrors,
        rawBacklog: rawCount,
        estimatedValue,
      });
    }

    logger.info('run finished', { agent: 'SupervisorAgent', actionsCount: actions.length });
    return { name: 'SupervisorAgent', actions };
  },
};

export { supervisorAgent };
