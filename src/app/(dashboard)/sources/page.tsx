import { prisma } from '@/lib/db';
import { SourcesClient } from './SourcesClient';
import { normalizeSourcePriority, normalizeSourceTrustLevel } from '@/types';

export default async function SourcesPage() {
  const sources = await prisma.sourceConfig.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const ingestCountsRaw = await prisma.freebie.groupBy({
    by: ['source'],
    _count: { _all: true },
  });

  const countsMap: Record<string, number> = {};
  ingestCountsRaw.forEach((c) => {
    countsMap[c.source] = c._count._all;
  });

  const sourcesWithCounts = sources.map((s) => ({
    ...s,
    priority: normalizeSourcePriority(s.priority),
    trustLevel: normalizeSourceTrustLevel(s.trustLevel),
    // Source matching boundary against freebies URL or Name tags
    ingestCount: countsMap[s.url] || countsMap[s.name] || 0,
  }));

  return <SourcesClient initialSources={sourcesWithCounts} />;
}
