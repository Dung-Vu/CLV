import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { executionAgent } from './execution.agent';
import { researchAgent } from './research.agent';
import { supervisorAgent } from './supervisor.agent';
import type { Agent, AgentContext, AgentResult } from './agent.types';

export const AGENTS: Agent[] = [supervisorAgent, researchAgent, executionAgent];

/**
 * Runs all agents sequentially.
 * Each agent gets a shared AgentContext with the current timestamp.
 * Errors in individual agents are caught so one failure doesn't stop the rest.
 */
export async function runAllAgents(): Promise<AgentResult[]> {
  const ctx: AgentContext = { now: new Date() };
  const results: AgentResult[] = [];

  logger.info('Agent runner started', { agents: AGENTS.map((a) => a.name) });

  for (const agent of AGENTS) {
    try {
      logger.info(`Running agent: ${agent.name}`);
      const result = await agent.run(ctx);
      results.push(result);

      // Persist run log to DB for observability
      await prisma.agentRunLog.create({
        data: { agentName: result.name, actions: result.actions },
      }).catch((e) => logger.warn('Failed to write AgentRunLog', { error: (e as Error).message }));

      logger.info(`Agent finished: ${agent.name}`, { actions: result.actions });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Agent error: ${agent.name}`, { error: msg });
      results.push({ name: agent.name, actions: [`ERROR: ${msg}`] });
    }
  }

  logger.info('Agent runner finished', { agentsRun: results.length });
  return results;
}
