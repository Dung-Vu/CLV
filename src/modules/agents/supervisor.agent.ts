import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { sendPipelineAlert } from '@/lib/telegram';
import type { Agent, AgentContext, AgentResult } from './agent.types';

/**
 * SupervisorAgent — reads daily stats from the DB and produces a
 * concise summary + recommendations (priority boosts, frequency hints).
 *
 * It does NOT trigger any pipeline itself — that is ExecutionAgent's job.
 * It acts as the "morning briefing" step that shapes what the other agents do.
 */
const supervisorAgent: Agent = {
  name: 'SupervisorAgent',

  async run(_ctx: AgentContext): Promise<AgentResult> {
    const actions: string[] = [];

    logger.info('[SupervisorAgent] run started');

    // 1. Gather stats
    const [statusCounts, totalValue, recentErrors] = await Promise.all([
      prisma.freebie.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.freebie.aggregate({
        where: { status: 'analyzed', eligibleVn: true },
        _sum: { valueUsd: true },
      }),
      prisma.freebie.count({ where: { status: 'analysis_error' } }),
    ]);

    const byStatus = statusCounts.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count._all;
      return acc;
    }, {});

    actions.push(
      `Stats: raw=${byStatus['raw'] ?? 0} analyzed=${byStatus['analyzed'] ?? 0} ` +
        `claimed=${byStatus['claimed'] ?? 0} ignored=${byStatus['ignored'] ?? 0} ` +
        `errors=${recentErrors}`,
    );

    const estimatedValue = totalValue._sum.valueUsd ?? 0;
    actions.push(`Estimated claimable value: $${estimatedValue.toFixed(0)}`);

    // 2. Simple recommendations
    const rawCount = byStatus['raw'] ?? 0;
    const analyzedCount = byStatus['analyzed'] ?? 0;

    if (rawCount > 20) {
      actions.push('RECOMMENDATION: High raw backlog — suggest increasing analyzer batch size');
    } else if (rawCount === 0 && analyzedCount === 0) {
      actions.push('RECOMMENDATION: Pipeline appears idle — suggest running ingestion');
    } else {
      actions.push('RECOMMENDATION: Pipeline looks healthy');
    }

    if (recentErrors > 5) {
      actions.push(
        `ALERT: ${recentErrors} analysis errors detected — consider checking LLM quota or prompt`,
      );
    }

    // Send Telegram alert if anomalies exist
    if (recentErrors > 5 || rawCount > 50) {
      await sendPipelineAlert({
        errorCount: recentErrors,
        rawBacklog: rawCount,
        estimatedValue: estimatedValue,
      });
    }

    logger.info('[SupervisorAgent] run finished', { actions });
    return { name: 'SupervisorAgent', actions };
  },
};

export { supervisorAgent };
