import Parser from 'rss-parser';
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
    return source.kind === 'rss';
  },

  async ingest(source: SourceConfig): Promise<RawItem[]> {
    const feed = await parser.parseURL(source.url);

    return (feed.items ?? []).map((item) => ({
      title: item.title?.trim() ?? 'Untitled',
      url: item.link ?? item.guid ?? '',
      description: item.contentSnippet ?? item.content ?? item.summary ?? undefined,
      sourceId: source.id,
      sourceName: source.name,
      publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
    })).filter((item) => item.url.length > 0);
  },
};
