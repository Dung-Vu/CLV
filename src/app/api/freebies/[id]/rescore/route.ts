import { NextResponse } from 'next/server';
import { scoreFreebie } from '@/modules/scoring/engine';
import { classifyTier } from '@/modules/policy/classifier';
import { logger } from '@/lib/logger';
// Next.js standard single-instance Prisma setup
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const freebie = await prisma.freebie.findUnique({ where: { id: params.id } });
    if (!freebie) {
      return NextResponse.json({ error: 'Freebie not found' }, { status: 404 });
    }

    const { score, breakdown, explanation } = scoreFreebie({
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

    await prisma.freebie.update({
      where: { id: params.id },
      data: { score, tier }
    });

    return NextResponse.json({ score, tier, breakdown, explanation });
  } catch (err: any) {
    logger.error('Error rescoring specific freebie:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
