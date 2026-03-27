import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { analyzePendingFreebies } from '@/modules/analyzer/analyzer.service';
import { getAutoCandidates } from '@/modules/execution/execution.service';
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
 * It does NOT auto-execute deals itself — that requires explicit human
 * action via the dashboard or CLI (Phase 8 guardrails).
 */
const executionAgent: Agent = {
  name: 'ExecutionAgent',

  async run(_ctx: AgentContext): Promise<AgentResult> {
    const actions: string[] = [];

    logger.info('[ExecutionAgent] run started');

    // 1. Check raw backlog
    const rawCount = await prisma.freebie.count({ where: { status: 'raw' } });
    actions.push(`Raw backlog: ${rawCount} items`);

    if (rawCount < INGEST_THRESHOLD_RAW) {
      actions.push(`Raw backlog below ${INGEST_THRESHOLD_RAW} — triggering ingestion`);
      try {
        const ingestResults = await runIngestionOnce();
        const totals = ingestResults.reduce(
          (acc, r) => ({ ingested: acc.ingested + r.created, skipped: acc.skipped + r.skipped, errors: acc.errors + r.errors }),
          { ingested: 0, skipped: 0, errors: 0 },
        );
        actions.push(
          `Ingestion done: ingested=${totals.ingested} skipped=${totals.skipped} errors=${totals.errors}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        actions.push(`Ingestion error: ${msg}`);
        logger.error('[ExecutionAgent] ingestion failed', { error: msg });
      }
    } else {
      actions.push('Raw backlog sufficient — skipping ingestion');
    }

    // 2. Analyze pending
    const pendingRaw = await prisma.freebie.count({ where: { status: 'raw' } });
    if (pendingRaw > 0) {
      actions.push(`Analyzing up to ${ANALYZE_BATCH_SIZE} pending raw items`);
      try {
        const analyzeResult = await analyzePendingFreebies(ANALYZE_BATCH_SIZE);
        actions.push(
          `Analyzer done: success=${analyzeResult.succeeded} failed=${analyzeResult.failed}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        actions.push(`Analyzer error: ${msg}`);
        logger.error('[ExecutionAgent] analyzer failed', { error: msg });
      }
    } else {
      actions.push('No pending raw items to analyze');
    }

    // 3. Rescore analyzed freebies
    try {
      const rescoreResult = await rescoreAnalyzedFreebies(RESCORE_BATCH_SIZE);
      actions.push(`Rescore done: updated=${rescoreResult.updated} records`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      actions.push(`Rescore error: ${msg}`);
      logger.error('[ExecutionAgent] rescore failed', { error: msg });
    }

    // 4. Report auto-candidates
    try {
      const candidates = await getAutoCandidates(10);
      if (candidates.length > 0) {
        actions.push(
          `Auto-candidates ready: ${candidates.length} — run 'pnpm execution:dry' to preview`,
        );
        for (const c of candidates) {
          actions.push(`  • [Tier ${c.tier}] score=${c.score} — ${c.title}`);
        }
      } else {
        actions.push('No Tier A auto-candidates at this time');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      actions.push(`Candidate check error: ${msg}`);
    }

    logger.info('[ExecutionAgent] run finished', { actionsCount: actions.length });
    return { name: 'ExecutionAgent', actions };
  },
};

export { executionAgent };
