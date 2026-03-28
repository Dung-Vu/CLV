import { NextResponse } from 'next/server';
import { scoreFreebie } from '@/modules/scoring/engine';
import { classifyTier } from '@/modules/policy/classifier';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import { normalizeFrictionLevel, normalizeRiskLevel } from '@/types';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST() {
  try {
    const freebies = await prisma.freebie.findMany({
      where: { status: 'analyzed' }
    });

    let updatedCount = 0;

    for (const freebie of freebies) {
      const riskLevel = normalizeRiskLevel(freebie.riskLevel);
      const frictionLevel = normalizeFrictionLevel(freebie.frictionLevel);

      const { score } = scoreFreebie({
        eligibleVn: !!freebie.eligibleVn,
        riskLevel,
        cardRequired: !!freebie.cardRequired,
        kycRequired: !!freebie.kycRequired,
        frictionLevel,
        valueUsd: freebie.valueUsd !== null ? Number(freebie.valueUsd) : null,
        expiry: freebie.expiry ? freebie.expiry.toISOString() : null,
        category: freebie.category || 'unknown',
        isDeal: true,
      });

      const tier = classifyTier({
        eligibleVn: !!freebie.eligibleVn,
        riskLevel,
        cardRequired: !!freebie.cardRequired,
        kycRequired: !!freebie.kycRequired,
        frictionLevel,
        isDeal: true,
        score
      });

      if (freebie.score !== score || freebie.tier !== tier) {
        await prisma.freebie.update({
          where: { id: freebie.id },
          data: { score, tier }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ updated: updatedCount });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Error mass rescoring', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
