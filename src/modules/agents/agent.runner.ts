import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { executionAgent } from './execution.agent';
import { researchAgent } from './research.agent';
import { supervisorAgent } from './supervisor.agent';
import type { Agent, AgentContext, AgentResult } from './agent.types';

export const AGENTS: Agent[] = [supervisorAgent, researchAgent, executionAgent];

/**
 * Runs all registered agents sequentially.
 *
 * Per-agent lifecycle:
 *   1. If agent.enabled === false → skip, write AgentRunLog with status='skipped'.
 *   2. Create AgentRunLog with status='running' + startedAt before run.
 *   3. Run the agent.
 *   4. Update AgentRunLog with status='success'/'error', finishedAt, actions.
 *
 * One agent failure does not stop the rest.
 */
export async function runAllAgents(
  runType: 'scheduled' | 'manual' = 'scheduled',
): Promise<AgentResult[]> {
  const ctx: AgentContext = { now: new Date(), runType };
  const results: AgentResult[] = [];

  logger.info('Agent runner started', { agents: AGENTS.map((a) => a.name), runType });

  for (const agent of AGENTS) {
    // ── Skip disabled agents ──────────────────────────────────────────────────────
    if (!agent.enabled) {
      logger.info('Agent disabled — skipping', { agent: agent.name });
      await prisma.agentRunLog
        .create({
          data: {
            agentName: agent.name,
            runType,
            status: 'skipped',
            actions: ['Agent disabled via env flag'],
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        })
        .catch((e) =>
          logger.warn('Failed to write AgentRunLog (skipped)', {
            agent: agent.name,
            error: (e as Error).message,
          }),
        );
      results.push({ name: agent.name, actions: ['skipped — disabled via env flag'] });
      continue;
    }

    // ── Start run log entry ──────────────────────────────────────────────
    const startedAt = new Date();
    let runLogId: string | null = null;

    runLogId = await prisma.agentRunLog
      .create({
        data: { agentName: agent.name, runType, status: 'running', actions: [], startedAt },
      })
      .then((r) => r.id)
      .catch((e) => {
        logger.warn('Failed to create AgentRunLog (start)', {
          agent: agent.name,
          error: (e as Error).message,
        });
        return null;
      });

    try {
      logger.info('Running agent', { agent: agent.name });
      const result = await agent.run(ctx);
      results.push(result);

      // ── Mark success ────────────────────────────────────────────────
      if (runLogId) {
        await prisma.agentRunLog
          .update({
            where: { id: runLogId },
            data: { status: 'success', actions: result.actions, finishedAt: new Date() },
          })
          .catch((e) =>
            logger.warn('Failed to update AgentRunLog (success)', {
              agent: agent.name,
              error: (e as Error).message,
            }),
          );
      }

      logger.info('Agent finished', { agent: agent.name, actionsCount: result.actions.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Agent error', { agent: agent.name, error: msg });

      // ── Mark error ─────────────────────────────────────────────────
      if (runLogId) {
        await prisma.agentRunLog
          .update({
            where: { id: runLogId },
            data: { status: 'error', error: msg, finishedAt: new Date() },
          })
          .catch((e) =>
            logger.warn('Failed to update AgentRunLog (error)', {
              agent: agent.name,
              error: (e as Error).message,
            }),
          );
      }

      results.push({ name: agent.name, actions: [`ERROR: ${msg}`] });
    }
  }

  logger.info('Agent runner finished', { agentsRun: results.length, runType });
  return results;
}

export async function getRecentAgentRuns(limit = 10) {
  return prisma.agentRunLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
    select: { agentName: true, startedAt: true, actions: true, status: true, finishedAt: true },
  });
}
