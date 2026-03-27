import { SOURCES } from './sources.config';
import type { SourceConfig } from './sources.config';

export function listEnabledSources(): SourceConfig[] {
  return SOURCES.filter((s) => s.enabled);
}

export function getSourceById(id: string): SourceConfig | undefined {
  return SOURCES.find((s) => s.id === id);
}

export function listAllSources(): SourceConfig[] {
  return SOURCES;
}
