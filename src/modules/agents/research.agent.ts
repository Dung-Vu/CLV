import { logger } from '@/lib/logger';
import { SOURCES } from '@/modules/sources/sources.config';
import type { Agent, AgentContext, AgentResult } from './agent.types';

/**
 * ResearchAgent — explores the current sources registry and produces
 * recommendations for enabling / adding sources.
 *
 * Phase 9 MVP: pure static analysis (no LLM).  A future version can use
 * LLM to scan community channels (Reddit / HN) for newly trending tools.
 */
const researchAgent: Agent = {
  name: 'ResearchAgent',

  async run(_ctx: AgentContext): Promise<AgentResult> {
    const actions: string[] = [];

    logger.info('[ResearchAgent] run started');

    const enabled = SOURCES.filter((s) => s.enabled);
    const disabled = SOURCES.filter((s) => !s.enabled);

    actions.push(
      `Sources: ${enabled.length} enabled, ${disabled.length} disabled`,
    );

    // Report disabled sources that might be worth enabling
    if (disabled.length > 0) {
      const high = disabled.filter((s) => s.priority === 'high');
      const medium = disabled.filter((s) => s.priority === 'medium');

      if (high.length > 0) {
        actions.push(
          `SUGGESTION: ${high.length} high-priority source(s) are disabled: ` +
            high.map((s) => s.name).join(', '),
        );
      }

      if (medium.length > 0) {
        actions.push(
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
      actions.push(
        `SUGGESTION: No enabled source covers categories: ${missingCategories.join(', ')} — consider adding feeds`,
      );
    } else {
      actions.push('Coverage looks good — all desired categories have at least one source');
    }

    logger.info('[ResearchAgent] run finished', { actions });
    return { name: 'ResearchAgent', actions };
  },
};

export { researchAgent };
