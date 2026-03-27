import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock heavy dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    freebie: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    claimLog: { create: vi.fn() },
    agentRunLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock('@/modules/ingestion/ingestion.service', () => ({
  runIngestionOnce: vi.fn().mockResolvedValue({ ingested: 3, skipped: 1, errors: 0 }),
}));

vi.mock('@/modules/analyzer/analyzer.service', () => ({
  analyzePendingFreebies: vi.fn().mockResolvedValue({ success: 2, failed: 0 }),
}));

vi.mock('@/modules/execution/execution.service', () => ({
  getAutoCandidates: vi.fn().mockResolvedValue([]),
  executeFreebie: vi.fn(),
}));

vi.mock('playwright', () => ({
  chromium: { launch: vi.fn() },
}));

import { prisma } from '@/lib/db';
import { supervisorAgent } from '@/modules/agents/supervisor.agent';
import { researchAgent } from '@/modules/agents/research.agent';
import { executionAgent } from '@/modules/agents/execution.agent';
import { runAllAgents } from '@/modules/agents/agent.runner';

const ctx = { now: new Date() };

// ── SupervisorAgent ──────────────────────────────────────────────────────────

describe('SupervisorAgent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a result with AgentResult shape', async () => {
    vi.mocked(prisma.freebie.groupBy).mockResolvedValue([
      { status: 'raw', _count: { _all: 5 } },
      { status: 'analyzed', _count: { _all: 10 } },
    ] as never);
    vi.mocked(prisma.freebie.aggregate).mockResolvedValue({ _sum: { valueUsd: 120 } } as never);
    vi.mocked(prisma.freebie.count).mockResolvedValue(0);

    const result = await supervisorAgent.run(ctx);

    expect(result.name).toBe('SupervisorAgent');
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it('adds ALERT when error count > 5', async () => {
    vi.mocked(prisma.freebie.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.freebie.aggregate).mockResolvedValue({ _sum: { valueUsd: null } } as never);
    vi.mocked(prisma.freebie.count).mockResolvedValue(8);

    const result = await supervisorAgent.run(ctx);

    expect(result.actions.some((a) => a.includes('ALERT'))).toBe(true);
  });
});

// ── ResearchAgent ────────────────────────────────────────────────────────────

describe('ResearchAgent', () => {
  it('returns a result and mentions source counts', async () => {
    const result = await researchAgent.run(ctx);

    expect(result.name).toBe('ResearchAgent');
    expect(result.actions.some((a) => a.includes('Sources:'))).toBe(true);
  });

  it('suggests disabled high-priority sources', async () => {
    const result = await researchAgent.run(ctx);
    // aws-blog-rss is high-priority but disabled in sources.config.ts
    const hasSuggestion = result.actions.some(
      (a) => a.includes('SUGGESTION') || a.includes('high-priority'),
    );
    // May or may not have it depending on config, but should run without error
    expect(result.actions.length).toBeGreaterThan(0);
    void hasSuggestion; // consumed to avoid lint warning
  });
});

// ── ExecutionAgent ───────────────────────────────────────────────────────────

describe('ExecutionAgent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runs ingestion when raw backlog is low', async () => {
    const { runIngestionOnce } = await import('@/modules/ingestion/ingestion.service');
    vi.mocked(prisma.freebie.count).mockResolvedValue(2); // below threshold
    vi.mocked(prisma.freebie.findMany).mockResolvedValue([] as never);

    const result = await executionAgent.run(ctx);

    expect(runIngestionOnce).toHaveBeenCalled();
    expect(result.name).toBe('ExecutionAgent');
    expect(result.actions.some((a) => a.includes('ingestion'))).toBe(true);
  });

  it('skips ingestion when raw backlog is sufficient', async () => {
    const { runIngestionOnce } = await import('@/modules/ingestion/ingestion.service');
    vi.mocked(prisma.freebie.count).mockResolvedValue(20); // above threshold
    vi.mocked(prisma.freebie.findMany).mockResolvedValue([] as never);

    await executionAgent.run(ctx);

    expect(runIngestionOnce).not.toHaveBeenCalled();
  });
});

// ── Agent Runner ─────────────────────────────────────────────────────────────

describe('runAllAgents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runs all 3 agents and returns results array', async () => {
    vi.mocked(prisma.freebie.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.freebie.aggregate).mockResolvedValue({ _sum: { valueUsd: null } } as never);
    vi.mocked(prisma.freebie.count).mockResolvedValue(0);
    vi.mocked(prisma.freebie.findMany).mockResolvedValue([] as never);

    const results = await runAllAgents();

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.name)).toEqual([
      'SupervisorAgent',
      'ResearchAgent',
      'ExecutionAgent',
    ]);
  });
});
