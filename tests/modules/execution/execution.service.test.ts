import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    freebie: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    claimLog: {
      create: vi.fn(),
    },
  },
}));

// Mock playwright — we don't want real browser in unit tests
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn(),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnThis(),
          isVisible: vi.fn().mockResolvedValue(false),
          fill: vi.fn(),
          click: vi.fn(),
          innerText: vi.fn().mockResolvedValue(''),
        }),
        url: vi.fn().mockReturnValue('https://example.com/dashboard'),
        waitForTimeout: vi.fn(),
        close: vi.fn(),
      }),
      close: vi.fn(),
    }),
  },
}));

import { prisma } from '@/lib/db';
import { getAutoCandidates, executeFreebie } from '@/modules/execution/execution.service';

const mockFreebieA = {
  id: 'exec-001',
  title: 'Free AI Tool — Tier A',
  url: 'https://example.com/signup',
  source: 'Product Hunt',
  status: 'analyzed',
  tier: 'A',
  score: 80,
  eligibleVn: true,
  cardRequired: false,
  kycRequired: false,
  riskLevel: 'low',
  frictionLevel: 'low',
  description: null,
  summaryVi: null,
  stepsJson: null,
  category: 'ai-tool',
  valueUsd: 25,
  expiry: null,
  analysisVersion: 'v1',
  createdAt: new Date(),
  updatedAt: new Date(),
  claimLogs: [],
};

const mockFreebieB = {
  ...mockFreebieA,
  id: 'exec-002',
  tier: 'B',
  cardRequired: true,
  score: 60,
};

describe('getAutoCandidates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only Tier A auto-candidates', async () => {
    vi.mocked(prisma.freebie.findMany).mockResolvedValue([mockFreebieA, mockFreebieB] as never);

    const result = await getAutoCandidates();

    // Only Tier A (low risk, no card/KYC, eligible, score >= 70) should pass policy check
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('exec-001');
  });

  it('returns empty array when no freebies qualify', async () => {
    vi.mocked(prisma.freebie.findMany).mockResolvedValue([] as never);

    const result = await getAutoCandidates();
    expect(result).toHaveLength(0);
  });
});

describe('executeFreebie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns dry_run result when EXECUTION_DRY_RUN=true (default)', async () => {
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieA as never);
    vi.mocked(prisma.claimLog.create).mockResolvedValue({} as never);

    const result = await executeFreebie('exec-001', 'dry_run');

    expect(result.success).toBe(true);
    expect(result.stepsLog.some((s) => s.includes('[dry_run]'))).toBe(true);
  });

  it('throws when freebie not found', async () => {
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(null);

    await expect(executeFreebie('missing-id', 'dry_run')).rejects.toThrow('Freebie not found');
  });

  it('throws when freebie is not an auto candidate (Tier B)', async () => {
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieB as never);

    await expect(executeFreebie('exec-002', 'dry_run')).rejects.toThrow(
      'not eligible for execution',
    );
  });

  it('writes ClaimLog after dry-run execution', async () => {
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieA as never);
    vi.mocked(prisma.claimLog.create).mockResolvedValue({} as never);

    await executeFreebie('exec-001', 'dry_run');

    expect(prisma.claimLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          freebieId: 'exec-001',
          status: 'success',
          mode: 'dry_run',
        }),
      }),
    );
  });
});
