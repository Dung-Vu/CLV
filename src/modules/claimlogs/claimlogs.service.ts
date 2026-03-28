import { prisma } from '@/lib/db';

export interface CreateClaimLogInput {
  freebieId: string;
  status: 'success' | 'failed' | 'skipped' | 'dry_run';
  mode?: 'manual' | 'semi_auto' | 'auto' | 'dry_run';
  note?: string;
  errorMsg?: string;
  evidenceUrl?: string;
  startedAt?: Date;
  finishedAt?: Date;
}

export async function createClaimLog(input: CreateClaimLogInput) {
  return prisma.claimLog.create({
    data: {
      freebieId: input.freebieId,
      status: input.status,
      mode: input.mode ?? 'manual',
      note: input.note,
      errorMsg: input.errorMsg,
      evidenceUrl: input.evidenceUrl,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt,
    },
  });
}

export async function getClaimLogsForFreebie(freebieId: string) {
  return prisma.claimLog.findMany({
    where: { freebieId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getClaimStats(): Promise<Record<string, number>> {
  const rows = await prisma.claimLog.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const result: Record<string, number> = {};
  for (const r of rows) {
    result[r.status] = r._count._all;
  }
  return result;
}
