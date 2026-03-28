import type { Prisma } from '@prisma/client';
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
    const {
      status,
      minScore,
      category,
      tier,
      tiers,
      search,
      sort = 'score',
      page = 1,
      pageSize = 20,
      dealsOnly = true,
    } = filters;
    const skip = (page - 1) * pageSize;

    const whereClauses: Prisma.FreebieWhereInput[] = [];

    if (dealsOnly) {
      whereClauses.push({ score: { gt: 0 } });
      whereClauses.push({ tier: { not: null } });
    }

    if (status) {
      whereClauses.push({
        status: Array.isArray(status) ? { in: status } : status,
      });
    }

    if (minScore !== undefined) {
      whereClauses.push({ score: { gte: minScore } });
    }

    if (category) {
      whereClauses.push({ category });
    }

    if (tier) {
      whereClauses.push({ tier });
    }

    if (tiers && tiers.length > 0) {
      whereClauses.push({ tier: { in: tiers } });
    }

    if (search) {
      whereClauses.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { source: { contains: search, mode: 'insensitive' } },
          { summaryVi: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.FreebieWhereInput = whereClauses.length > 0 ? { AND: whereClauses } : {};

    const [items, total] = await prisma.$transaction([
      prisma.freebie.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sort]: 'desc' },
      }),
      prisma.freebie.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        isDeal: item.status === 'analyzed' ? item.score > 0 && item.tier !== null : null,
      })),
      total,
      page,
      pageSize,
    };
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

  async findForRescore(limit = 50) {
    return prisma.freebie.findMany({
      where: { status: 'analyzed' },
      take: limit,
      orderBy: { updatedAt: 'asc' },
    });
  },

  async updateScore(id: string, score: number) {
    return prisma.freebie.update({
      where: { id },
      data: { score },
    });
  },

  async countByCategory() {
    return prisma.freebie.groupBy({
      by: ['category'],
      _count: { _all: true },
    });
  },

  async getEstimatedClaimableValue() {
    const result = await prisma.freebie.aggregate({
      where: { status: 'analyzed', eligibleVn: true },
      _sum: { valueUsd: true },
    });

    return result._sum.valueUsd ?? 0;
  },

  async countEligibleAnalyzed() {
    return prisma.freebie.count({
      where: { status: 'analyzed', eligibleVn: true },
    });
  },

  async cleanupAnalyzedNonDeals(note: string) {
    return prisma.$transaction(async (tx) => {
      const candidates = await tx.freebie.findMany({
        where: { status: 'analyzed', score: 0 },
        select: { id: true },
      });

      if (candidates.length === 0) {
        return { cleaned: 0 };
      }

      const candidateIds = candidates.map((candidate) => candidate.id);
      const updated = await tx.freebie.updateMany({
        where: {
          id: { in: candidateIds },
          status: 'analyzed',
          score: 0,
        },
        data: { status: 'ignored' },
      });

      if (updated.count > 0) {
        await tx.claimLog.createMany({
          data: candidateIds.map((freebieId) => ({
            freebieId,
            status: 'skipped',
            mode: 'manual',
            note,
          })),
        });
      }

      return { cleaned: updated.count };
    });
  },
};
