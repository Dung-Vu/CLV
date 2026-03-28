import { logger } from '@/lib/logger';
import type { SourceConfig } from '../../sources/sources.config';
import type { Collector, RawItem } from '../ingestion.types';
import { env } from '@/lib/env';

export const searchCollector: Collector = {
  id: 'search',
  supports: (source) => source.kind === 'search',
  ingest: async (source: SourceConfig): Promise<RawItem[]> => {
    logger.info(`Starting search collector for source ${source.id}`);

    if (!env.SERPER_API_KEY) {
      logger.warn('SERPER_API_KEY is not configured. Skipping search collector.');
      return [];
    }

    if (!source.searchQuery) {
      logger.warn(`Source ${source.id} has no searchQuery defined. Skipping.`);
      return [];
    }

    const url = 'https://google.serper.dev/search';
    const payload = {
      q: source.searchQuery,
      num: 20,
      gl: 'vn',
      hl: 'vi',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Serper API error: ${response.status}`, { errorText });
        return [];
      }

      const data = await response.json();
      const organics = data.organic || [];

      const items: RawItem[] = organics.map((item: any) => {
        return {
          sourceId: source.id,
          sourceName: source.name,
          url: item.link || '',
          title: item.title || 'Untitled',
          description: item.snippet || '',
          publishedAt: new Date(),
        };
      });

      logger.info(`Search collector ${source.id} found ${items.length} items`);
      return items;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Error in search collector ${source.id}`, { error: message });
      return [];
    }
  },
};
