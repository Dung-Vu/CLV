import { logger } from '@/lib/logger';
import { createRawFreebie } from '@/modules/freebies/freebies.service';
import { listEnabledSources } from '@/modules/sources/sources.service';
import { rssCollector } from './collectors/rss.collector';
import type { Collector, IngestionResult } from './ingestion.types';

const collectors: Collector[] = [rssCollector];

function findCollector(source: ReturnType<typeof listEnabledSources>[0]): Collector | undefined {
  return collectors.find((c) => c.supports(source));
}

async function ingestSource(
  source: ReturnType<typeof listEnabledSources>[0],
): Promise<IngestionResult> {
  const start = Date.now();
  const result: IngestionResult = {
    sourceId: source.id,
    sourceName: source.name,
    fetched: 0,
    created: 0,
    skipped: 0,
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
      const freebie = await createRawFreebie({
        title: item.title,
        url: item.url,
        source: source.name,
        description: item.description,
      });
      // upsert returns the record; if createdAt === updatedAt it's likely new
      if (freebie.createdAt.getTime() === freebie.updatedAt.getTime()) {
        result.created++;
      } else {
        result.skipped++;
      }
    } catch {
      result.errors++;
      logger.error('Failed to save freebie', { url: item.url, sourceId: source.id });
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}

export async function runIngestionOnce(): Promise<IngestionResult[]> {
  const sources = listEnabledSources();
  logger.info('Starting ingestion run', { sourceCount: sources.length });

  const results: IngestionResult[] = [];

  for (const source of sources) {
    try {
      const result = await ingestSource(source);
      results.push(result);
      logger.info('Source ingested', result);
    } catch (err) {
      logger.error('Source ingestion failed', { sourceId: source.id, error: err });
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        fetched: 0,
        created: 0,
        skipped: 0,
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
      acc.errors += r.errors;
      return acc;
    },
    { fetched: 0, created: 0, skipped: 0, errors: 0 },
  );

  logger.info('Ingestion run complete', { ...total, sources: sources.length });
  return results;
}
