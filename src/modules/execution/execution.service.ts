import { chromium } from 'playwright';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { createClaimLog } from '@/modules/claimlogs/claimlogs.service';
import { freebiesRepository } from '@/modules/freebies/freebies.repository';
import { classifyTier, evaluateExecutionPolicy } from '@/modules/policy/policy.service';
import { runSignupFlow } from './drivers/playwright.driver';
import type { ExecutionMode, ExecutionResult, FreebieForExecution } from './execution.types';

/**
 * Returns freebies that pass the Tier-A auto-candidate policy check.
 */
export async function getAutoCandidates(limit = 10): Promise<FreebieForExecution[]> {
  const rows = await freebiesRepository.findAutoCandidates(limit);

  return rows.filter((f) => {
    const tier = classifyTier({
      eligibleVn: f.eligibleVn,
      riskLevel: f.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
      cardRequired: f.cardRequired,
      kycRequired: f.kycRequired,
      frictionLevel: f.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
      score: f.score,
    });

    const policy = evaluateExecutionPolicy(
      {
        eligibleVn: f.eligibleVn,
        riskLevel: f.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
        cardRequired: f.cardRequired,
        kycRequired: f.kycRequired,
        frictionLevel: f.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
        score: f.score,
        tier,
      },
      env.APP_MODE,
    );

    return policy.isAutoCandidate;
  }) as FreebieForExecution[];
}

/**
 * Executes (or dry-runs) the signup flow for a single freebie.
 *
 * Guardrails:
 *   - Always checks policy before proceeding.
 *   - When mode=dry_run (or EXECUTION_DRY_RUN=true), skips the real browser run
 *     and returns a synthetic success result for testing purposes.
 *   - Writes a ClaimLog entry after every attempt.
 */
export async function executeFreebie(
  freebieId: string,
  mode: ExecutionMode,
): Promise<ExecutionResult> {
  logger.info('Starting execution', { freebieId, mode });

  const freebie = await freebiesRepository.findById(freebieId);
  if (!freebie) throw new Error(`Freebie not found: ${freebieId}`);

  // Policy gate
  const tier = classifyTier({
    eligibleVn: freebie.eligibleVn,
    riskLevel: freebie.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
    cardRequired: freebie.cardRequired,
    kycRequired: freebie.kycRequired,
    frictionLevel: freebie.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
    score: freebie.score,
  });

  const policy = evaluateExecutionPolicy(
    {
      eligibleVn: freebie.eligibleVn,
      riskLevel: freebie.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
      cardRequired: freebie.cardRequired,
      kycRequired: freebie.kycRequired,
      frictionLevel: freebie.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
      score: freebie.score,
      tier,
    },
    env.APP_MODE,
  );

  if (!policy.isAutoCandidate) {
    throw new Error(
      `Freebie ${freebieId} is not eligible for execution (tier=${tier}, isAutoCandidate=false)`,
    );
  }

  const claimEmail = env.CLAIM_EMAIL ?? 'clv-claim@example.com';

  // Dry-run: skip real browser, write synthetic log
  const effectiveMode: ExecutionMode =
    env.EXECUTION_DRY_RUN ? 'dry_run' : mode;

  let result: ExecutionResult;

  if (effectiveMode === 'dry_run') {
    logger.info('Dry-run mode — skipping real browser execution', { freebieId });
    result = {
      success: true,
      stepsLog: [
        `[dry_run] Would navigate to ${freebie.url}`,
        `[dry_run] Would fill email: ${claimEmail}`,
        `[dry_run] Would click submit`,
      ],
    };
  } else {
    const browser = await chromium.launch({ headless: true });
    try {
      result = await runSignupFlow(
        {
          freebieId,
          url: freebie.url,
          mode: effectiveMode,
          email: claimEmail,
        },
        browser,
      );
    } finally {
      await browser.close().catch(() => undefined);
    }
  }

  // Write ClaimLog
  await createClaimLog({
    freebieId,
    status: result.success ? 'success' : 'failed',
    mode: effectiveMode,
    note: result.stepsLog.join(' | ').slice(0, 500),
    errorMsg: result.error,
  });

  logger.info('Execution finished', { freebieId, success: result.success, mode: effectiveMode });
  return result;
}
