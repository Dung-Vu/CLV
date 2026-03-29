import { getLlmClient } from '@/lib/llm';
import { logger } from '@/lib/logger';
import { findPendingRaw, updateAnalysis } from '@/modules/freebies/freebies.service';
import { scoreFreebie } from '../scoring/engine';
import { classifyTier } from '../policy/classifier';
import { ANALYZER_VERSION, buildAnalyzerPrompt } from './analyzer.prompt';
import { analyzerOutputSchema } from './analyzer.types';
import type { AnalyzerFrictionLevel, AnalyzerInput, AnalyzerRiskLevel } from './analyzer.types';

const MAX_RETRIES = 3;

async function callLlmWithRetry(input: AnalyzerInput): Promise<string> {
  const prompt = buildAnalyzerPrompt(input);
  const client = getLlmClient();
  const TIMEOUT_MS = 15000; // 15s max per attempt

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const chatPromise = client.chat([{ role: 'user', content: prompt }], {
        temperature: 0.1,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`LLM timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
      });

      const response = await Promise.race([chatPromise, timeoutPromise]) as any;
      return response.content;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delayMs = Math.pow(2, attempt - 1) * 1000; // exponential: 1s, 2s, 4s
      logger.warn('LLM call failed or timed out, retrying', { attempt, delayMs, freebieId: input.id });
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
    const riskLevel: AnalyzerRiskLevel = validated.risk_level;
    const frictionLevel: AnalyzerFrictionLevel = validated.friction_level;
    const dealEvidence = validated.deal_evidence.trim();
    const isDeal = validated.is_deal && dealEvidence.length > 0;

    // Apply strict deterministic scoring and policy classification
    const engineResult = scoreFreebie({
      eligibleVn: !!validated.eligible_vn,
      riskLevel,
      cardRequired: !!validated.card_required,
      kycRequired: !!validated.kyc_required,
      frictionLevel,
      valueUsd: validated.value_usd ?? null,
      expiry: validated.expiry || null,
      category: validated.category || 'unknown',
      isDeal,
    });

    const finalScore = isDeal ? engineResult.score : 0;
    const finalTier = isDeal
      ? classifyTier({
          eligibleVn: !!validated.eligible_vn,
          riskLevel,
          cardRequired: !!validated.card_required,
          kycRequired: !!validated.kyc_required,
          frictionLevel,
          isDeal,
          score: finalScore,
        })
      : 'C';

    await updateAnalysis(freebieId, {
      valueUsd: validated.value_usd,
      expiry: validated.expiry ? new Date(validated.expiry) : null,
      eligibleVn: validated.eligible_vn,
      riskLevel: validated.risk_level,
      category: validated.category,
      score: finalScore,
      tier: finalTier,
      summaryVi: validated.summary_vi,
      stepsJson: JSON.stringify(validated.steps),
      cardRequired: validated.card_required,
      kycRequired: validated.kyc_required,
      frictionLevel: validated.friction_level,
      analysisVersion: ANALYZER_VERSION,
      status: 'analyzed',
    });

    logger.info('Freebie analyzed by AI & Engine', {
      freebieId,
      score: finalScore,
      tier: finalTier,
      llmScoreHint: validated.score,
      llmTierHint: validated.tier_hint,
      eligibleVn: validated.eligible_vn,
      isDeal,
      dealEvidence,
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
