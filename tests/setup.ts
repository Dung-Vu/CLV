// Global test setup — runs before every test file
import { vi } from 'vitest';

// Mock the env module so tests don't require real env vars
vi.mock('@/lib/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://postgres:test@localhost:5432/clv_test',
    AI_BASE_URL: 'https://api.openai.com/v1',
    AI_API_KEY: 'sk-test',
    AI_MODEL: 'test-model',
    AI_MAX_TOKENS: 500,
    LOG_LEVEL: 'error',
    APP_MODE: 'clean',
    AUTO_CLAIM_ENABLED: false,
    EXECUTION_DRY_RUN: true,
  },
}));

// Suppress logger output in tests
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
