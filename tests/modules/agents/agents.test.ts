import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  prisma: {
    agentRunLog: {
      create: vi.fn().mockResolvedValue({ id: 'run-log-id-1' }),
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    claimLog: { create: vi.fn() },
  },
}));

vi.mock('@/modules/freebies/freebies.service', () => ({
  getDashboardStats: vi.fn().mockResolvedValue({}),
  getEstimatedClaimableValue: vi.fn().mockResolvedValue(0),
  countByStatus: vi.fn().mockResolvedValue(0),
}));

vi.mock('@/modules/ingestion/ingestion.service', () => ({
  runIngestionOnce: vi.fn().mockResolvedValue([{ created: 3, skipped: 1, errors: 0 }]),
}));

vi.mock('@/modules/analyzer/analyzer.service', () => ({
  analyzePendingFreebies: vi.fn().mockResolvedValue({ processed: 2, succeeded: 2, failed: 0 }),
}));

vi.mock('@/modules/execution/execution.service', () => ({
  getAutoCandidates: vi.fn().mockResolvedValue([]),
  executeFreebie: vi.fn(),
}));

vi.mock('@/modules/scoring/scoring.batch', () => ({
  rescoreAnalyzedFreebies: vi.fn().mockResolvedValue({ updated: 0 }),
}));

vi.mock('playwright', () => ({
  chromium: { launch: vi.fn() },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { prisma } from '@/lib/db';
import {
  getDashboardStats,
  getEstimatedClaimableValue,
  countByStatus,
} from '@/modules/freebies/freebies.service';
import { supervisorAgent } from '@/modules/agents/supervisor.agent';
import { researchAgent } from '@/modules/agents/research.agent';
import { executionAgent } from '@/modules/agents/execution.agent';
import { runAllAgents } from '@/modules/agents/agent.runner';

const ctx = { now: new Date() };

// ── SupervisorAgent ───────────────────────────────────────────────────────────

describe('SupervisorAgent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reports healthy pipeline stats', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({ raw: 5, analyzed: 10, claimed: 3 });
    vi.mocked(getEstimatedClaimableValue).mockResolvedValue(120);

    const result = await supervisorAgent.run(ctx);

    expect(result.name).toBe('SupervisorAgent');
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions.some((a) => a.includes('Stats:'))).toBe(true);
  });

  it('adds ALERT when analysis_error count > 5', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({ analysis_error: 8 });
    vi.mocked(getEstimatedClaimableValue).mockResolvedValue(0);

    const result = await supervisorAgent.run(ctx);

    expect(result.actions.some((a) => a.includes('ALERT'))).toBe(true);
  });

  it('recommends ingestion when pipeline is idle', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({ raw: 0, analyzed: 0 });
    vi.mocked(getEstimatedClaimableValue).mockResolvedValue(0);

    const result = await supervisorAgent.run(ctx);

    expect(result.actions.some((a) => a.includes('idle'))).toBe(true);
  });

  it('is enabled by default (env flag)', () => {
    expect(supervisorAgent.enabled).toBe(true);
  });
});

// ── ResearchAgent ─────────────────────────────────────────────────────────────

describe('ResearchAgent', () => {
  it('returns a result and mentions source counts', async () => {
    const result = await researchAgent.run(ctx);

    expect(result.name).toBe('ResearchAgent');
    expect(result.actions.some((a) => a.includes('Sources:'))).toBe(true);
  });

  it('produces at least one action', async () => {
    const result = await researchAgent.run(ctx);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it('is enabled by default (env flag)', () => {
    expect(researchAgent.enabled).toBe(true);
  });
});

// ── ExecutionAgent ────────────────────────────────────────────────────────────

describe('ExecutionAgent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runs ingestion when raw backlog is below threshold', async () => {
    const { runIngestionOnce } = await import('@/modules/ingestion/ingestion.service');
    // Below INGEST_THRESHOLD_RAW (5) on first call, still some on second
    vi.mocked(countByStatus).mockResolvedValueOnce(2).mockResolvedValueOnce(2);

    const result = await executionAgent.run(ctx);

    expect(runIngestionOnce).toHaveBeenCalled();
    expect(result.name).toBe('ExecutionAgent');
    expect(result.actions.some((a) => a.includes('ingestion'))).toBe(true);
  });

  it('skips ingestion when raw backlog is sufficient', async () => {
    const { runIngestionOnce } = await import('@/modules/ingestion/ingestion.service');
    vi.mocked(countByStatus).mockResolvedValue(20); // above threshold

    await executionAgent.run(ctx);

    expect(runIngestionOnce).not.toHaveBeenCalled();
  });

  it('is enabled by default (env flag)', () => {
    expect(executionAgent.enabled).toBe(true);
  });
});

// ── Agent Runner ──────────────────────────────────────────────────────────────

describe('runAllAgents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runs all 3 agents and returns results array', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({ raw: 0, analyzed: 0 });
    vi.mocked(getEstimatedClaimableValue).mockResolvedValue(0);
    vi.mocked(countByStatus).mockResolvedValue(10);
    vi.mocked(prisma.agentRunLog.create).mockResolvedValue({ id: 'run-1' } as never);

    const results = await runAllAgents('scheduled');

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.name)).toEqual([
      'SupervisorAgent',
      'ResearchAgent',
      'ExecutionAgent',
    ]);
  });

  it('creates an AgentRunLog entry at start and updates at end for each agent', async () => {
    vi.mocked(getDashboardStats).mockResolvedValue({});
    vi.mocked(getEstimatedClaimableValue).mockResolvedValue(0);
    vi.mocked(countByStatus).mockResolvedValue(10);
    vi.mocked(prisma.agentRunLog.create).mockResolvedValue({ id: 'run-1' } as never);

    await runAllAgents();

    // create called once per agent (3 agents → 3 creates)
    expect(prisma.agentRunLog.create).toHaveBeenCalledTimes(3);
    // update called once per agent for success
    expect(prisma.agentRunLog.update).toHaveBeenCalledTimes(3);
    // first create should have status='running'
    expect(vi.mocked(prisma.agentRunLog.create).mock.calls[0][0]).toMatchObject({
      data: expect.objectContaining({ status: 'running' }),
    });
  });

  it('writes a skipped log and skips run when agent is disabled', async () => {
    // Temporarily mark supervisorAgent as disabled by overriding env mock
    const { env } = await import('@/lib/env');
    vi.mocked(env as unknown as Record<string, boolean>).AGENT_SUPERVISOR_ENABLED = false;

    try {
      vi.mocked(getDashboardStats).mockResolvedValue({});
      vi.mocked(getEstimatedClaimableValue).mockResolvedValue(0);
      vi.mocked(countByStatus).mockResolvedValue(10);
      vi.mocked(prisma.agentRunLog.create).mockResolvedValue({ id: 'skip-1' } as never);

      const results = await runAllAgents();
      const supervisorResult = results.find((r) => r.name === 'SupervisorAgent');

      expect(supervisorResult?.actions[0]).toContain('skipped');
      // skipped log uses create, not update
      const skipCreate = vi.mocked(prisma.agentRunLog.create).mock.calls.find(
        (c: unknown[]) => (c[0] as { data?: { status?: string } }).data?.status === 'skipped',
      );
      expect(skipCreate).toBeDefined();
    } finally {
      vi.mocked(env as unknown as Record<string, boolean>).AGENT_SUPERVISOR_ENABLED = true;
    }
  });
});
