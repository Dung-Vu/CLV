import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/metrics
 *
 * Returns a lightweight JSON snapshot of pipeline health:
 * - Freebie counts by status & category
 * - Claim stats (success/failed/skipped)
 * - Recent agent runs (last 10)
 * - Estimated claimable value
 *
 * Not authenticated — CLV is single-user self-hosted, so this is fine.
 */
export async function GET() {
  try {
    const [byStatus, byCategory, claimStats, recentAgentRuns, valueAggregate] = await Promise.all([
      prisma.freebie.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.freebie.groupBy({ by: ['category'], _count: { _all: true } }),
      prisma.claimLog.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.agentRunLog.findMany({
        orderBy: { runAt: 'desc' },
        take: 10,
        select: { agentName: true, runAt: true, actions: true },
      }),
      prisma.freebie.aggregate({
        where: { status: 'analyzed', eligibleVn: true },
        _sum: { valueUsd: true },
        _count: { _all: true },
      }),
    ]);

    const statusMap = byStatus.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count._all;
      return acc;
    }, {});

    const categoryMap = byCategory.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = r._count._all;
      return acc;
    }, {});

    const claimMap = claimStats.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count._all;
      return acc;
    }, {});

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      freebies: {
        byStatus: statusMap,
        byCategory: categoryMap,
        estimatedClaimableValueUsd: valueAggregate._sum.valueUsd ?? 0,
        eligibleAnalyzedCount: valueAggregate._count._all,
      },
      claims: claimMap,
      recentAgentRuns,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('GET /api/metrics error', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
