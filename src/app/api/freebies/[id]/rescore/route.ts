import { NextRequest, NextResponse } from 'next/server';
import { scoreFreebie } from '@/modules/scoring/engine';
import { classifyTier } from '@/modules/policy/classifier';
import { logger } from '@/lib/logger';
// Next.js standard single-instance Prisma setup
import { prisma } from '@/lib/db';
import { normalizeFrictionLevel, normalizeRiskLevel } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const freebie = await prisma.freebie.findUnique({ where: { id } });
    if (!freebie) {
      return NextResponse.json({ error: 'Freebie not found' }, { status: 404 });
    }

    const riskLevel = normalizeRiskLevel(freebie.riskLevel);
    const frictionLevel = normalizeFrictionLevel(freebie.frictionLevel);

    const { score, breakdown, explanation } = scoreFreebie({
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

    await prisma.freebie.update({
      where: { id },
      data: { score, tier }
    });

    return NextResponse.json({ score, tier, breakdown, explanation });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('Error rescoring specific freebie', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
