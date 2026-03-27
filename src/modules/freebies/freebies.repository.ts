import { prisma } from '@/lib/db';
import type { FreebieStatus } from '@/types';
import type {
  CreateRawFreebieInput,
  FreebieFilters,
  FreebieListResult,
  UpdateAnalysisInput,
} from './freebies.types';

export const freebiesRepository = {
  async create(input: CreateRawFreebieInput) {
    return prisma.freebie.upsert({
      where: { url: input.url },
      update: {}, // skip if already exists (same URL = same deal)
      create: {
        title: input.title,
        source: input.source,
        url: input.url,
        description: input.description,
        status: 'raw',
      },
    });
  },

  async findById(id: string) {
    return prisma.freebie.findUnique({
      where: { id },
      include: { claimLogs: { orderBy: { createdAt: 'desc' } } },
    });
  },

  async findByStatus(status: FreebieStatus, limit = 10) {
    return prisma.freebie.findMany({
      where: { status },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  },

  async findMany(filters: FreebieFilters): Promise<FreebieListResult> {
    const { status, minScore, category, tier, search, page = 1, pageSize = 20 } = filters;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(status && {
        status: Array.isArray(status) ? { in: status } : status,
      }),
      ...(minScore !== undefined && { score: { gte: minScore } }),
      ...(category && { category }),
      ...(tier && { tier }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { source: { contains: search, mode: 'insensitive' as const } },
          { summaryVi: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.freebie.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { score: 'desc' },
      }),
      prisma.freebie.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  async updateStatus(id: string, status: FreebieStatus) {
    return prisma.freebie.update({
      where: { id },
      data: { status },
    });
  },

  async updateAnalysis(id: string, data: UpdateAnalysisInput) {
    return prisma.freebie.update({
      where: { id },
      data,
    });
  },

  async countByStatus() {
    return prisma.freebie.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  },

  /**
   * Returns analyzed freebies that are potentially Tier-A auto candidates.
   * Filtering is intentionally coarse here (score + eligibility) — the full
   * policy check happens in execution.service to keep policy logic centralised.
   */
  async findAutoCandidates(limit = 10) {
    return prisma.freebie.findMany({
      where: {
        status: 'analyzed',
        eligibleVn: true,
        cardRequired: false,
        kycRequired: false,
        score: { gte: 50 },
      },
      orderBy: { score: 'desc' },
      take: limit,
    });
  },
};
