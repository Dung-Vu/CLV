import Parser from 'rss-parser';
import { logger } from '@/lib/logger';
import type { SourceConfig } from '@/modules/sources/sources.config';
import type { Collector, RawItem } from '../ingestion.types';

const parser = new Parser({
  timeout: 10_000,
  headers: {
    'User-Agent': 'CLV/0.1 RSS Collector (personal freebie hunter)',
  },
});

export const rssCollector: Collector = {
  id: 'rss-collector',

  supports(source: SourceConfig): boolean {
    return source.kind === 'rss' || source.kind === 'reddit';
  },

  async ingest(source: SourceConfig): Promise<RawItem[]> {
    const feed = await parser.parseURL(source.url);
    const items: RawItem[] = [];

    for (const item of feed.items ?? []) {
      try {
        const url = item.link ?? item.guid ?? '';
        if (!url) continue;
        const rawContent = item.content ?? (item as any)['content:encoded'] ?? item.contentSnippet ?? item.summary ?? '';
        const truncatedContent = rawContent.length > 800 ? rawContent.slice(0, 800) + '...' : rawContent;

        items.push({
          title: item.title?.trim() ?? 'Untitled',
          url,
          description: truncatedContent || undefined,
          sourceId: source.id,
          sourceName: source.name,
          publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        });
      } catch (err) {
        logger.warn('Failed to parse RSS item', {
          sourceId: source.id,
          error: (err as Error).message,
        });
      }
    }

    return items;
  },
};
