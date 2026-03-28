import type { SourceConfig } from '@/modules/sources/sources.config';

export interface RawItem {
  title: string;
  url: string;
  description?: string;
  sourceId: string;
  sourceName: string;
  publishedAt?: Date;
}

export interface Collector {
  readonly id: string;
  supports(source: SourceConfig): boolean;
  ingest(source: SourceConfig): Promise<RawItem[]>;
}

export interface IngestionResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  created: number;
  skipped: number;
  filteredOut: number;
  errors: number;
  durationMs: number;
}
