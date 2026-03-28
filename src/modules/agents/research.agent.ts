import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { listEnabledSources } from '@/modules/sources/sources.service';
import { searchCollector } from '@/modules/ingestion/collectors/search.collector';
import { filterByKeyword } from '@/modules/ingestion/filters/keyword.filter';
import { createRawFreebie, freebieExistsByUrl } from '@/modules/freebies/freebies.service';
import type { Agent, AgentContext, AgentResult } from './agent.types';

const researchAgent: Agent = {
  name: 'ResearchAgent',
  get enabled() { return env.AGENT_RESEARCH_ENABLED; },

  async run(ctx: AgentContext): Promise<AgentResult> {
    void ctx;
    logger.info('run started', { agent: 'ResearchAgent' });

    const sources = await listEnabledSources();
    const searchSources = sources.filter(s => s.kind === 'search');
    
    let totalFound = 0;
    
    for (const source of searchSources) {
      try {
        const items = await searchCollector.ingest(source);
        
        for (const item of items) {
          const exists = await freebieExistsByUrl(item.url);
          if (exists) continue;
          
          const filterResult = filterByKeyword(item);
          if (filterResult.pass) {
            await createRawFreebie({
              title: item.title,
              source: source.name,
              url: item.url,
              description: item.description,
              publishedAt: item.publishedAt,
              status: 'raw',
            });
            totalFound++;
          }
        }
      } catch (err) {
        logger.error(`ResearchAgent error searching source ${source.id}`, { error: err });
      }
    }

    const actions = [`Found ${totalFound} new items from ${searchSources.length} queries`];
    logger.info('run finished', { agent: 'ResearchAgent', actionsCount: actions.length });
    
    return { name: 'ResearchAgent', actions };
  },
};

export { researchAgent };
