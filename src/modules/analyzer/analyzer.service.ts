import { getLlmClient } from '@/lib/llm';
import { logger } from '@/lib/logger';
import { findPendingRaw, updateAnalysis } from '@/modules/freebies/freebies.service';
import { ANALYZER_VERSION, buildAnalyzerPrompt } from './analyzer.prompt';
import { analyzerOutputSchema } from './analyzer.types';
import type { AnalyzerInput } from './analyzer.types';

const MAX_RETRIES = 2;

async function callLlmWithRetry(input: AnalyzerInput): Promise<string> {
  const prompt = buildAnalyzerPrompt(input);
  const client = getLlmClient();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat([{ role: 'user', content: prompt }], {
        temperature: 0.1,
      });
      return response.content;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delayMs = attempt * 2000;
      logger.warn('LLM call failed, retrying', { attempt, delayMs, freebieId: input.id });
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  throw new Error('LLM retry limit exceeded');
}

function stripMarkdownJson(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export async function analyzeFreebieOnce(freebieId: string): Promise<boolean> {
  const { getFreebieById } = await import('@/modules/freebies/freebies.service');
  const freebie = await getFreebieById(freebieId);

  if (!freebie) {
    throw new Error(`Freebie not found: ${freebieId}`);
  }

  const input: AnalyzerInput = {
    id: freebie.id,
    title: freebie.title,
    source: freebie.source,
    url: freebie.url,
    description: freebie.description ?? undefined,
  };

  logger.info('Analyzing freebie', { freebieId, title: freebie.title });

  try {
    const rawContent = await callLlmWithRetry(input);
    const cleaned = stripMarkdownJson(rawContent);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`LLM returned invalid JSON: ${cleaned.slice(0, 200)}`);
    }

    const validated = analyzerOutputSchema.parse(parsed);

    await updateAnalysis(freebieId, {
      valueUsd: validated.value_usd,
      expiry: validated.expiry ? new Date(validated.expiry) : null,
      eligibleVn: validated.eligible_vn,
      riskLevel: validated.risk_level,
      category: validated.category,
      score: validated.score,
      tier: validated.tier_hint,
      summaryVi: validated.summary_vi,
      stepsJson: JSON.stringify(validated.steps),
      cardRequired: validated.card_required,
      kycRequired: validated.kyc_required,
      frictionLevel: validated.friction_level,
      analysisVersion: ANALYZER_VERSION,
      status: 'analyzed',
    });

    logger.info('Freebie analyzed', {
      freebieId,
      score: validated.score,
      tier: validated.tier_hint,
      eligibleVn: validated.eligible_vn,
    });

    return true;
  } catch (err) {
    logger.error('Analyzer failed for freebie', { freebieId, error: err });
    await updateAnalysis(freebieId, { status: 'analysis_error' });
    return false;
  }
}

export async function analyzePendingFreebies(limit = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const pending = await findPendingRaw(limit);
  logger.info('Starting analyzer batch', { count: pending.length });

  let succeeded = 0;
  let failed = 0;

  for (const freebie of pending) {
    const ok = await analyzeFreebieOnce(freebie.id);
    if (ok) succeeded++;
    else failed++;
  }

  logger.info('Analyzer batch complete', { processed: pending.length, succeeded, failed });
  return { processed: pending.length, succeeded, failed };
}
