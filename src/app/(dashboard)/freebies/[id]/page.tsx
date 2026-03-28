import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { FreebieDetailClient } from './detail-client';
import { scoreFreebie } from '@/modules/scoring/engine';
import { normalizeFrictionLevel, normalizeRiskLevel } from '@/types';
import type { FreebieDetailView } from './detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FreebieDetailPage({ params }: PageProps) {
  const { id } = await params;
  const freebie = await prisma.freebie.findUnique({
    where: { id },
    include: { claimLogs: true },
  });

  if (!freebie) return notFound();

  const { breakdown, explanation } = scoreFreebie({
    eligibleVn: !!freebie.eligibleVn,
    riskLevel: normalizeRiskLevel(freebie.riskLevel),
    cardRequired: !!freebie.cardRequired,
    kycRequired: !!freebie.kycRequired,
    frictionLevel: normalizeFrictionLevel(freebie.frictionLevel),
    valueUsd: freebie.valueUsd !== null ? Number(freebie.valueUsd) : null,
    expiry: freebie.expiry ? freebie.expiry.toISOString() : null,
    category: freebie.category || 'unknown',
    isDeal: true,
  });

  const detailFreebie: FreebieDetailView = freebie;

  return (
    <FreebieDetailClient freebie={detailFreebie} breakdown={breakdown} explanation={explanation} />
  );
}
