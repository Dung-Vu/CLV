import { logger } from '@/lib/logger';
import { createRawFreebie, freebieExistsByUrl } from '@/modules/freebies/freebies.service';
import { listEnabledSources } from '@/modules/sources/sources.service';
import type { SourceConfig } from '@/modules/sources/sources.config';
import { rssCollector } from './collectors/rss.collector';
import { searchCollector } from './collectors/search.collector';
import { filterByKeyword } from './filters/keyword.filter';
import type { Collector, IngestionResult } from './ingestion.types';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const collectors: Collector[] = [rssCollector, searchCollector];

function findCollector(source: SourceConfig): Collector | undefined {
  return collectors.find((c) => c.supports(source));
}

async function ingestSource(
  source: SourceConfig,
): Promise<IngestionResult> {
  const start = Date.now();
  const result: IngestionResult = {
    sourceId: source.id,
    sourceName: source.name,
    fetched: 0,
    created: 0,
    skipped: 0,
    filteredOut: 0,
    errors: 0,
    durationMs: 0,
  };

  const collector = findCollector(source);
  if (!collector) {
    logger.warn('No collector found for source', { sourceId: source.id, kind: source.kind });
    return result;
  }

  const items = await collector.ingest(source);
  result.fetched = items.length;

  for (const item of items) {
    try {
      const exists = await freebieExistsByUrl(item.url);
      if (exists) {
        result.skipped++;
        continue;
      }

      const filterResult = filterByKeyword(item);

      if (!filterResult.pass) {
        await createRawFreebie({
          title: item.title,
          url: item.url,
          source: source.name,
          description: item.description,
          publishedAt: item.publishedAt,
          status: 'ignored',
          note: `keyword_filter:${filterResult.reason}`,
        });
        result.filteredOut++;
        continue;
      }

      await createRawFreebie({
        title: item.title,
        url: item.url,
        source: source.name,
        description: item.description,
        publishedAt: item.publishedAt,
      });
      result.created++;
    } catch (err) {
      result.errors++;
      logger.error('Failed to save freebie', {
        url: item.url,
        sourceId: source.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}

export async function runIngestionOnce(): Promise<IngestionResult[]> {
  const sources = await listEnabledSources();
  logger.info('Starting ingestion run', { sourceCount: sources.length });

  const results: IngestionResult[] = [];

  for (const source of sources) {
    try {
      const result = await ingestSource(source);
      results.push(result);
      logger.info('Source ingested', result);
      await sleep(500);
    } catch (err) {
      logger.error('Source ingestion failed', { sourceId: source.id, error: err });
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        fetched: 0,
        created: 0,
        skipped: 0,
        filteredOut: 0,
        errors: 1,
        durationMs: 0,
      });
    }
  }

  const total = results.reduce(
    (acc, r) => {
      acc.fetched += r.fetched;
      acc.created += r.created;
      acc.skipped += r.skipped;
      acc.filteredOut += r.filteredOut;
      acc.errors += r.errors;
      return acc;
    },
    { fetched: 0, created: 0, skipped: 0, filteredOut: 0, errors: 0 },
  );

  logger.info('Ingestion run complete', { ...total, sources: sources.length });
  return results;
}
