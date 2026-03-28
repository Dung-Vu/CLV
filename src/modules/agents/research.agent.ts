import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { SOURCES } from '@/modules/sources/sources.config';
import type { Agent, AgentContext, AgentResult } from './agent.types';

/**
 * ResearchAgent — explores the current sources registry and produces
 * recommendations for enabling / adding sources.
 *
 * Orchestration only: pure static analysis of source config (no LLM, no DB).
 * A future version can use LLM to scan community channels for trending tools.
 */
const researchAgent: Agent = {
  name: 'ResearchAgent',
  get enabled() { return env.AGENT_RESEARCH_ENABLED; },

  async run(ctx: AgentContext): Promise<AgentResult> {
    void ctx;
    const actions: string[] = [];
    const log = (msg: string) => { actions.push(msg); };

    logger.info('run started', { agent: 'ResearchAgent' });

    const enabled = SOURCES.filter((s) => s.enabled);
    const disabled = SOURCES.filter((s) => !s.enabled);

    log(`Sources: ${enabled.length} enabled, ${disabled.length} disabled`);

    // Report disabled sources that might be worth enabling
    if (disabled.length > 0) {
      const high = disabled.filter((s) => s.priority === 'high');
      const medium = disabled.filter((s) => s.priority === 'medium');

      if (high.length > 0) {
        log(
          `SUGGESTION: ${high.length} high-priority source(s) are disabled: ` +
            high.map((s) => s.name).join(', '),
        );
      }

      if (medium.length > 0) {
        log(
          `INFO: ${medium.length} medium-priority source(s) are disabled: ` +
            medium.map((s) => s.name).join(', '),
        );
      }
    }

    // Report coverage by category
    const tags = new Set(enabled.flatMap((s) => s.tags));
    const missingCategories: string[] = [];
    const desiredCoverage = ['ai', 'saas', 'cloud', 'dev', 'voucher'];
    for (const cat of desiredCoverage) {
      if (!tags.has(cat)) missingCategories.push(cat);
    }

    if (missingCategories.length > 0) {
      log(`SUGGESTION: No enabled source covers categories: ${missingCategories.join(', ')} — consider adding feeds`);
    } else {
      log('Coverage looks good — all desired categories have at least one source');
    }

    logger.info('run finished', { agent: 'ResearchAgent', actionsCount: actions.length });
    return { name: 'ResearchAgent', actions };
  },
};

export { researchAgent };
