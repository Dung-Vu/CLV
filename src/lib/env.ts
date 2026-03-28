import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AI_BASE_URL: z.string().url('AI_BASE_URL must be a valid URL'),
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
  AI_MODEL: z.string().default('qwen3.5-plus'),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(1000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  APP_MODE: z.enum(['clean', 'grey']).default('clean'),
  AUTO_CLAIM_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  EXECUTION_DRY_RUN: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),
  CLAIM_EMAIL: z.string().email().optional(),
  SERPER_API_KEY: optionalTrimmedString,
  TELEGRAM_BOT_TOKEN: optionalTrimmedString,
  TELEGRAM_CHAT_ID: optionalTrimmedString,
  // Per-agent enable/disable flags (all default to enabled)
  AGENT_SUPERVISOR_ENABLED: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),
  AGENT_RESEARCH_ENABLED: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),
  AGENT_EXECUTION_ENABLED: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // console.error intentionally used here — logger.ts chưa khởi tạo tại bootstrap,
  // dùng logger sẽ gây circular init. Đây là exception duy nhất cho rule no-console.
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables — check your .env file');
}

export const env = parsed.data;
