import { prisma } from '@/lib/db';

export interface CreateClaimLogInput {
  freebieId: string;
  status: 'success' | 'failed' | 'skipped' | 'dry_run';
  mode?: 'manual' | 'semi_auto' | 'auto' | 'dry_run';
  note?: string;
  errorMsg?: string;
}

export async function createClaimLog(input: CreateClaimLogInput) {
  return prisma.claimLog.create({
    data: {
      freebieId: input.freebieId,
      status: input.status,
      mode: input.mode ?? 'manual',
      note: input.note,
      errorMsg: input.errorMsg,
    },
  });
}

export async function getClaimLogsForFreebie(freebieId: string) {
  return prisma.claimLog.findMany({
    where: { freebieId },
    orderBy: { createdAt: 'desc' },
  });
}
