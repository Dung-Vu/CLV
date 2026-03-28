import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

import { env } from '@/lib/env';
import { prisma } from '@/lib/db';
import { getAutoCandidates, executeFreebie } from '@/modules/execution/execution.service';

// Helpers to temporarily override env values
function withEnv(overrides: Partial<typeof env>, fn: () => Promise<void>) {
  return async () => {
    const saved = { ...env } as Record<string, unknown>;
    Object.assign(env, overrides);
    try {
      await fn();
    } finally {
      Object.assign(env, saved);
    }
  };
}

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

    // mockFreebieB has cardRequired=true → Tier B → filtered out
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

  // ── Basic flow ─────────────────────────────────────────────────────────

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

  // ── Tier A hard gate ───────────────────────────────────────────────────

  it('throws when freebie is not Tier A (Tier B due to cardRequired)', async () => {
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieB as never);

    await expect(executeFreebie('exec-002', 'dry_run')).rejects.toThrow('not Tier A');
  });

  it('throws with tier information in the message', async () => {
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieB as never);

    await expect(executeFreebie('exec-002', 'dry_run')).rejects.toThrow(/tier=B/);
  });

  // ── Panic switch ───────────────────────────────────────────────────────

  it(
    'throws when AUTO_CLAIM_ENABLED=false and requesting semi_auto (panic switch)',
    withEnv({ AUTO_CLAIM_ENABLED: false, EXECUTION_DRY_RUN: false }, async () => {
      // panic switch fires before DB load — no need to mock findUnique
      await expect(executeFreebie('exec-001', 'semi_auto')).rejects.toThrow(
        'Execution blocked',
      );
    }),
  );

  it(
    'allows dry_run even when AUTO_CLAIM_ENABLED=false (dry_run has no side effects)',
    withEnv({ AUTO_CLAIM_ENABLED: false, EXECUTION_DRY_RUN: true }, async () => {
      vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieA as never);
      vi.mocked(prisma.claimLog.create).mockResolvedValue({} as never);

      const result = await executeFreebie('exec-001', 'semi_auto');
      // EXECUTION_DRY_RUN=true converts semi_auto → dry_run, so it proceeds safely
      expect(result.success).toBe(true);
    }),
  );

  // ── ClaimLog ───────────────────────────────────────────────────────────

  it('writes ClaimLog after dry-run with status, mode, startedAt, finishedAt', async () => {
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieA as never);
    vi.mocked(prisma.claimLog.create).mockResolvedValue({} as never);

    await executeFreebie('exec-001', 'dry_run');

    expect(prisma.claimLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          freebieId: 'exec-001',
          status: 'success',
          mode: 'dry_run',
          startedAt: expect.any(Date),
          finishedAt: expect.any(Date),
        }),
      }),
    );
  });

  // ── Grey mode ─────────────────────────────────────────────────────────

  it(
    'includes [app_mode=grey] prefix in ClaimLog note when APP_MODE=grey',
    withEnv({ APP_MODE: 'grey', AUTO_CLAIM_ENABLED: false, EXECUTION_DRY_RUN: true }, async () => {
      vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieA as never);
      vi.mocked(prisma.claimLog.create).mockResolvedValue({} as never);

      await executeFreebie('exec-001', 'dry_run');

      expect(prisma.claimLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            note: expect.stringContaining('[app_mode=grey]'),
          }),
        }),
      );
    }),
  );

  it(
    'does NOT include grey prefix in ClaimLog note when APP_MODE=clean',
    withEnv({ APP_MODE: 'clean', AUTO_CLAIM_ENABLED: false, EXECUTION_DRY_RUN: true }, async () => {
      vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebieA as never);
      vi.mocked(prisma.claimLog.create).mockResolvedValue({} as never);

      await executeFreebie('exec-001', 'dry_run');

      const callData = vi.mocked(prisma.claimLog.create).mock.calls[0][0] as {
        data: { note: string };
      };
      expect(callData.data.note).not.toContain('[app_mode=grey]');
    }),
  );
});
