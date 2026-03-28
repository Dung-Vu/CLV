import { env } from './env';

export const config = {
  app: {
    nodeEnv: env.NODE_ENV,
    mode: env.APP_MODE,
  },
  llm: {
    baseUrl: env.AI_BASE_URL,
    model: env.AI_MODEL,
    maxTokens: env.AI_MAX_TOKENS,
  },
  features: {
    autoClaimEnabled: env.AUTO_CLAIM_ENABLED,
    executionDryRun: env.EXECUTION_DRY_RUN,
  },
  agents: {
    supervisorEnabled: env.AGENT_SUPERVISOR_ENABLED,
    researchEnabled: env.AGENT_RESEARCH_ENABLED,
    executionEnabled: env.AGENT_EXECUTION_ENABLED,
  },
} as const;
