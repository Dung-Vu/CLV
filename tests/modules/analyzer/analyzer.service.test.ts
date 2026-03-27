import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LlmClient } from '@/lib/llm';
import { setLlmClient, resetLlmClient } from '@/lib/llm';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    freebie: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockFreebie = {
  id: 'cld123',
  title: 'Free AI Tool — 3 months Pro',
  source: 'Product Hunt',
  url: 'https://example.com/free-ai',
  description: 'Sign up with email to get 3 months Pro for free. Available globally.',
  status: 'raw',
  claimLogs: [],
};

const mockLlmOutput = JSON.stringify({
  value_usd: 30,
  expiry: null,
  eligible_vn: true,
  risk_level: 'low',
  category: 'ai-tool',
  score: 78,
  summary_vi: 'Đăng ký email để nhận 3 tháng Pro miễn phí.',
  steps: ['Truy cập trang web', 'Đăng ký bằng email', 'Kích hoạt gói Pro'],
  card_required: false,
  kyc_required: false,
  friction_level: 'low',
  tier_hint: 'A',
});

describe('analyzeFreebieOnce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLlmClient();
  });

  it('parses valid LLM output and updates freebie', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebie as never);
    vi.mocked(prisma.freebie.update).mockResolvedValue({ ...mockFreebie, status: 'analyzed' } as never);

    const mockClient: LlmClient = {
      chat: vi.fn().mockResolvedValue({ content: mockLlmOutput, model: 'test' }),
    };
    setLlmClient(mockClient);

    const { analyzeFreebieOnce } = await import('@/modules/analyzer/analyzer.service');
    const result = await analyzeFreebieOnce('cld123');

    expect(result).toBe(true);
    expect(prisma.freebie.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'analyzed',
          score: 78,
          tier: 'A',
          eligibleVn: true,
        }),
      }),
    );
  });

  it('returns false and marks error when LLM returns invalid JSON', async () => {
    const { prisma } = await import('@/lib/db');
    vi.mocked(prisma.freebie.findUnique).mockResolvedValue(mockFreebie as never);
    vi.mocked(prisma.freebie.update).mockResolvedValue(mockFreebie as never);

    const mockClient: LlmClient = {
      chat: vi.fn().mockResolvedValue({ content: 'not json at all', model: 'test' }),
    };
    setLlmClient(mockClient);

    const { analyzeFreebieOnce } = await import('@/modules/analyzer/analyzer.service');
    const result = await analyzeFreebieOnce('cld123');

    expect(result).toBe(false);
    expect(prisma.freebie.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'analysis_error' } }),
    );
  });
});
