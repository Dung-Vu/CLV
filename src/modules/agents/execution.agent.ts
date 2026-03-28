import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { analyzePendingFreebies } from '@/modules/analyzer/analyzer.service';
import { getAutoCandidates } from '@/modules/execution/execution.service';
import { countByStatus } from '@/modules/freebies/freebies.service';
import { runIngestionOnce } from '@/modules/ingestion/ingestion.service';
import { rescoreAnalyzedFreebies } from '@/modules/scoring/scoring.batch';
import type { Agent, AgentContext, AgentResult } from './agent.types';

const INGEST_THRESHOLD_RAW = 5;   // run ingestion when fewer than N raw items pending
const ANALYZE_BATCH_SIZE = 10;
const RESCORE_BATCH_SIZE = 30;

/**
 * ExecutionAgent — the pipeline orchestrator.
 *
 * Each run performs (in order):
 *   1. Ingest new items if the raw backlog is low.
 *   2. Analyze pending raw items.
 *   3. Re-score analyzed freebies so scores stay fresh.
 *   4. Report auto-candidates available for semi-auto execution.
 *
 * Orchestration only: delegates all business logic to module service functions.
 * It does NOT auto-execute deals — that requires explicit human action (Phase 8 guardrails).
 */
const executionAgent: Agent = {
  name: 'ExecutionAgent',
  get enabled() { return env.AGENT_EXECUTION_ENABLED; },

  async run(_ctx: AgentContext): Promise<AgentResult> {
    const actions: string[] = [];
    const log = (msg: string) => { actions.push(msg); };

    logger.info('run started', { agent: 'ExecutionAgent' });

    // 1. Check raw backlog via service (no direct prisma)
    const rawCount = await countByStatus('raw');
    log(`Raw backlog: ${rawCount} items`);

    if (rawCount < INGEST_THRESHOLD_RAW) {
      log(`Raw backlog below ${INGEST_THRESHOLD_RAW} — triggering ingestion`);
      try {
        const ingestResults = await runIngestionOnce();
        const totals = ingestResults.reduce(
          (acc, r) => ({ ingested: acc.ingested + r.created, skipped: acc.skipped + r.skipped, errors: acc.errors + r.errors }),
          { ingested: 0, skipped: 0, errors: 0 },
        );
        log(`Ingestion done: ingested=${totals.ingested} skipped=${totals.skipped} errors=${totals.errors}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`Ingestion error: ${msg}`);
        logger.error('ingestion failed', { agent: 'ExecutionAgent', error: msg });
      }
    } else {
      log('Raw backlog sufficient — skipping ingestion');
    }

    // 2. Analyze pending — re-fetch status after ingestion
    const pendingRaw = await countByStatus('raw');
    if (pendingRaw > 0) {
      log(`Analyzing up to ${ANALYZE_BATCH_SIZE} pending raw items`);
      try {
        const analyzeResult = await analyzePendingFreebies(ANALYZE_BATCH_SIZE);
        log(`Analyzer done: success=${analyzeResult.succeeded} failed=${analyzeResult.failed}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`Analyzer error: ${msg}`);
        logger.error('analyzer failed', { agent: 'ExecutionAgent', error: msg });
      }
    } else {
      log('No pending raw items to analyze');
    }

    // 3. Rescore analyzed freebies
    try {
      const rescoreResult = await rescoreAnalyzedFreebies(RESCORE_BATCH_SIZE);
      log(`Rescore done: updated=${rescoreResult.updated} records`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`Rescore error: ${msg}`);
      logger.error('rescore failed', { agent: 'ExecutionAgent', error: msg });
    }

    // 4. Report auto-candidates (Tier A — does not execute them)
    try {
      const candidates = await getAutoCandidates(10);
      if (candidates.length > 0) {
        log(`Auto-candidates ready: ${candidates.length} — run 'pnpm execution:dry' to preview`);
        for (const c of candidates) {
          log(`  • [Tier ${c.tier}] score=${c.score} — ${c.title}`);
        }
      } else {
        log('No Tier A auto-candidates at this time');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`Candidate check error: ${msg}`);
      logger.error('candidate check failed', { agent: 'ExecutionAgent', error: msg });
    }

    logger.info('run finished', { agent: 'ExecutionAgent', actionsCount: actions.length });
    return { name: 'ExecutionAgent', actions };
  },
};

export { executionAgent };
