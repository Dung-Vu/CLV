import { prisma } from '@/lib/db';
import { SOURCES } from './sources.config';
import type { SourceConfig } from './sources.config';

/**
 * Reads enabled sources from the DB (SourceConfig table).
 * Falls back to the hardcoded SOURCES array if DB returns nothing (e.g., not seeded yet).
 */
export async function listEnabledSources(): Promise<SourceConfig[]> {
  try {
    const rows = await prisma.sourceConfig.findMany({ where: { enabled: true } });
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        kind: r.kind as SourceConfig['kind'],
        url: r.url,
        enabled: r.enabled,
        priority: r.priority as SourceConfig['priority'],
        trustLevel: r.trustLevel as SourceConfig['trustLevel'],
        tags: r.tags as string[],
        notes: r.notes ?? undefined,
        searchQuery: r.searchQuery ?? undefined,
      }));
    }
  } catch {
    // DB unavailable — fall through to static config
  }
  // Fallback: static config
  return SOURCES.filter((s) => s.enabled);
}

export function getSourceById(id: string): SourceConfig | undefined {
  return SOURCES.find((s) => s.id === id);
}

export function listAllSources(): SourceConfig[] {
  return SOURCES;
}
