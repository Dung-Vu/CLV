import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { countByCategory, getDashboardStats, getEstimatedClaimableValue } from '@/modules/freebies/freebies.service';
import { getClaimStats } from '@/modules/claimlogs/claimlogs.service';
import { getRecentAgentRuns } from '@/modules/agents/agent.runner';

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
    const [byStatus, byCategory, claimMap, recentAgentRuns, estimatedValue] = await Promise.all([
      getDashboardStats(),
      countByCategory(),
      getClaimStats(),
      getRecentAgentRuns(10),
      getEstimatedClaimableValue(),
    ]);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      freebies: {
        byStatus,
        byCategory,
        estimatedClaimableValueUsd: estimatedValue._sum.valueUsd ?? 0,
        eligibleAnalyzedCount: estimatedValue._count._all,
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
