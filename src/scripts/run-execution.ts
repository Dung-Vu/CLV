/**
 * CLI script: list auto-candidate freebies and optionally execute them.
 *
 * Usage:
 *   pnpm tsx src/scripts/run-execution.ts           # dry_run
 *   pnpm tsx src/scripts/run-execution.ts --real    # semi_auto (requires user confirmation)
 *
 * env.EXECUTION_DRY_RUN=true (default) forces dry_run regardless of --real flag.
 */

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Ensure env is validated first
import '@/lib/env';

import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { executeFreebie, getAutoCandidates } from '@/modules/execution/execution.service';
import type { ExecutionMode } from '@/modules/execution/execution.types';

async function confirm(rl: readline.Interface, question: string): Promise<boolean> {
  const answer = await rl.question(question);
  return answer.trim().toLowerCase() === 'y';
}

async function main() {
  const isReal = process.argv.includes('--real');
  const mode: ExecutionMode = isReal && !env.EXECUTION_DRY_RUN ? 'semi_auto' : 'dry_run';

  logger.info('run-execution started', { mode, EXECUTION_DRY_RUN: env.EXECUTION_DRY_RUN });

  const candidates = await getAutoCandidates(10);

  if (candidates.length === 0) {
    logger.info('No Tier A auto-candidate freebies found');
    process.exit(0);
  }

  logger.info(`Found ${candidates.length} auto-candidate(s)`, {
    candidates: candidates.map((f) => ({ tier: f.tier, score: f.score, title: f.title, url: f.url })),
  });
  logger.info(
    mode === 'dry_run'
      ? 'Running in DRY-RUN mode — no real browser actions'
      : 'Running in SEMI-AUTO mode — real browser will be launched',
  );

  const rl = readline.createInterface({ input, output });

  for (const freebie of candidates) {
    logger.info(`Candidate: [${freebie.tier ?? '?'}] ${freebie.title}`, { url: freebie.url });

    const proceed = await confirm(rl, `  Execute? (y/N) `);
    if (!proceed) {
      logger.info('Skipped', { freebieId: freebie.id });
      continue;
    }

    try {
      const result = await executeFreebie(freebie.id, mode);

      if (result.success) {
        logger.info('Execution success', { freebieId: freebie.id });
      } else {
        logger.warn('Execution failed', { freebieId: freebie.id, error: result.error ?? 'unknown error' });
      }
      logger.info('Steps log', { freebieId: freebie.id, steps: result.stepsLog });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Execution error', { freebieId: freebie.id, error: msg });
    }
  }

  rl.close();
  logger.info('run-execution finished');
  process.exit(0);
}

main().catch((err) => {
  logger.error('run-execution fatal error', { error: err instanceof Error ? err.message : err });
  process.exit(1);
});
