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
  console.log('\n🤖 CLV Agent Runner\n');

  const results = await runAllAgents();

  for (const result of results) {
    console.log(`\n━━ [${result.name}] ━━`);
    for (const action of result.actions) {
      console.log(`  ${action}`);
    }
  }

  console.log('\n✅ All agents finished.\n');
}

main().catch((err) => {
  logger.error('run-agents fatal error', { error: err instanceof Error ? err.message : err });
  process.exit(1);
});
