import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FreebieDetailClient } from "./detail-client";
import { scoreFreebie } from "@/modules/scoring/engine";

export default async function FreebieDetailPage({ params }: { params: { id: string } }) {
   const freebie = await prisma.freebie.findUnique({
      where: { id: params.id },
      include: { claimLogs: true }
   });
   
   if (!freebie) return notFound();
   
   const { breakdown, explanation } = scoreFreebie({
      eligibleVn: !!freebie.eligibleVn,
      riskLevel: (freebie.riskLevel as any) || 'unknown',
      cardRequired: !!freebie.cardRequired,
      kycRequired: !!freebie.kycRequired,
      frictionLevel: (freebie.frictionLevel as any) || 'unknown',
      valueUsd: freebie.valueUsd ? Number(freebie.valueUsd) : null,
      expiry: freebie.expiry ? freebie.expiry.toISOString() : null,
      category: freebie.category || 'unknown'
   });

   return <FreebieDetailClient freebie={freebie as any} breakdown={breakdown} explanation={explanation} />;
}
