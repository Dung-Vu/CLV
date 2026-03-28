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
  const result: Record<string, number> = {};
  for (const row of counts) {
    result[row.status] = row._count._all;
  }
  return result;
}

export async function countByCategory() {
  const rows = await freebiesRepository.countByCategory();
  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.category] = row._count._all;
  }
  return result;
}

export async function countByStatus(status: string): Promise<number> {
  const stats = await getDashboardStats();
  return stats[status] ?? 0;
}

export async function getEstimatedClaimableValue() {
  return freebiesRepository.getEstimatedClaimableValue();
}
