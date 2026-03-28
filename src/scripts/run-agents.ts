/**
 * CLI script: run all CLV agents once.
 *
 * Usage:
 *   pnpm agents:run
 *
 * Runs: SupervisorAgent → ResearchAgent → ExecutionAgent
 * Each agent's actions are printed to stdout.
 */

import '@/lib/env'; // validate env on startup

import { runAllAgents } from '@/modules/agents/agent.runner';
import { logger } from '@/lib/logger';

async function main() {
  logger.info('=== CLV Agent Runner START ===');

  const results = await runAllAgents();

  for (const result of results) {
    logger.info(`Agent finished: ${result.name}`, { actions: result.actions });
  }

  logger.info('=== CLV Agent Runner DONE ===', { agentsRun: results.length });
}

main().catch((err) => {
  logger.error('run-agents fatal error', { error: err instanceof Error ? err.message : err });
  process.exit(1);
});
