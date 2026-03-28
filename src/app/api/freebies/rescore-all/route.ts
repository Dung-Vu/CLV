import { NextResponse } from 'next/server';
import { scoreFreebie } from '@/modules/scoring/engine';
import { classifyTier } from '@/modules/policy/classifier';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const freebies = await prisma.freebie.findMany({
      where: { status: 'analyzed' }
    });

    let updatedCount = 0;

    for (const freebie of freebies) {
      const { score } = scoreFreebie({
        eligibleVn: !!freebie.eligibleVn,
        riskLevel: (freebie.riskLevel as any) || 'unknown',
        cardRequired: !!freebie.cardRequired,
        kycRequired: !!freebie.kycRequired,
        frictionLevel: (freebie.frictionLevel as any) || 'unknown',
        valueUsd: freebie.valueUsd ? Number(freebie.valueUsd) : null,
        expiry: freebie.expiry ? freebie.expiry.toISOString() : null,
        category: freebie.category || 'unknown'
      });

      const tier = classifyTier({
        eligibleVn: !!freebie.eligibleVn,
        riskLevel: (freebie.riskLevel as any) || 'unknown',
        cardRequired: !!freebie.cardRequired,
        kycRequired: !!freebie.kycRequired,
        frictionLevel: (freebie.frictionLevel as any) || 'unknown',
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
  } catch (err: any) {
    logger.error('Error mass rescoring:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
