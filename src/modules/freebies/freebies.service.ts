import { logger } from '@/lib/logger';
import { createClaimLog } from '@/modules/claimlogs/claimlogs.service';
import { freebiesRepository } from './freebies.repository';
import type {
  CreateRawFreebieInput,
  FreebieFilters,
  UpdateAnalysisInput,
} from './freebies.types';

export async function createRawFreebie(input: CreateRawFreebieInput) {
  const freebie = await freebiesRepository.create(input);
  return freebie;
}

export async function findPendingRaw(limit = 10) {
  return freebiesRepository.findByStatus('raw', limit);
}

export async function getFreebieById(id: string) {
  return freebiesRepository.findById(id);
}

export async function listFreebies(filters: FreebieFilters) {
  return freebiesRepository.findMany(filters);
}

export async function markClaimed(freebieId: string, note?: string) {
  logger.info('Marking freebie as claimed', { freebieId, note });
  const freebie = await freebiesRepository.updateStatus(freebieId, 'claimed');
  await createClaimLog({ freebieId, status: 'success', mode: 'manual', note });
  return freebie;
}

export async function markIgnored(freebieId: string, reason?: string) {
  logger.info('Marking freebie as ignored', { freebieId, reason });
  const freebie = await freebiesRepository.updateStatus(freebieId, 'ignored');
  await createClaimLog({ freebieId, status: 'skipped', mode: 'manual', note: reason });
  return freebie;
}

export async function updateAnalysis(freebieId: string, analysis: UpdateAnalysisInput) {
  return freebiesRepository.updateAnalysis(freebieId, analysis);
}

export async function getDashboardStats() {
  const counts = await freebiesRepository.countByStatus();
  return counts.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});
}
