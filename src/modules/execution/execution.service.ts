import { chromium } from 'playwright';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { createClaimLog } from '@/modules/claimlogs/claimlogs.service';
import { freebiesRepository } from '@/modules/freebies/freebies.repository';
import { classifyTier, evaluateExecutionPolicy } from '@/modules/policy/policy.service';
import { runSignupFlow } from './drivers/playwright.driver';
import type { ExecutionMode, ExecutionResult, FreebieForExecution } from './execution.types';

/**
 * Returns freebies that are classified as Tier A.
 *
 * Listing candidates is independent of AUTO_CLAIM_ENABLED — the feature flag
 * controls whether execution is allowed, not whether freebies are discoverable.
 * The caller (script / API route) handles presentation; executeFreebie enforces
 * the panic switch before any real browser action.
 */
export async function getAutoCandidates(limit = 10): Promise<FreebieForExecution[]> {
  const rows = (await freebiesRepository.findAutoCandidates(limit)) as FreebieForExecution[];

  return rows.filter((f) => {
    const tier = classifyTier({
      eligibleVn: f.eligibleVn,
      riskLevel: f.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
      cardRequired: f.cardRequired,
      kycRequired: f.kycRequired,
      frictionLevel: f.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
      score: f.score,
    });
    return tier === 'A';
  }) as FreebieForExecution[];
}

/**
 * Executes (or dry-runs) the signup flow for a single freebie.
 *
 * Guard order:
 *   1. Panic switch — blocks all real execution when AUTO_CLAIM_ENABLED=false.
 *   2. Freebie must exist in DB.
 *   3. Tier A hard gate — only Tier A is eligible for execution.
 *   4. Policy check — isAutoCandidate must be true.
 *   5. Dry-run path: log the plan, no side effects beyond ClaimLog.
 *   6. Semi-auto path: real browser execution.
 *   7. ClaimLog written unconditionally after every attempt.
 */
export async function executeFreebie(
  freebieId: string,
  mode: ExecutionMode,
): Promise<ExecutionResult> {
  // ── 1. Compute effective mode (DRY_RUN env overrides caller's mode) ────
  const effectiveMode: ExecutionMode = env.EXECUTION_DRY_RUN ? 'dry_run' : mode;

  // ── 2. Panic switch ────────────────────────────────────────────────────
  // Block all real (non-dry-run) execution when AUTO_CLAIM_ENABLED=false.
  // EXECUTION_DRY_RUN=true is safe — it only logs a plan with no side effects.
  if (effectiveMode !== 'dry_run' && !env.AUTO_CLAIM_ENABLED) {
    throw new Error(
      'Execution blocked: AUTO_CLAIM_ENABLED=false (panic switch). ' +
      'Set AUTO_CLAIM_ENABLED=true to allow real execution.',
    );
  }

  logger.info('Starting execution', { freebieId, effectiveMode, appMode: env.APP_MODE });

  // ── 3. Load freebie ────────────────────────────────────────────────────
  const freebie = await freebiesRepository.findById(freebieId);
  if (!freebie) throw new Error(`Freebie not found: ${freebieId}`);

  // ── 4. Tier A hard gate ────────────────────────────────────────────────
  const tier = classifyTier({
    eligibleVn: freebie.eligibleVn,
    riskLevel: freebie.riskLevel as 'low' | 'medium' | 'high' | 'unknown',
    cardRequired: freebie.cardRequired,
    kycRequired: freebie.kycRequired,
    frictionLevel: freebie.frictionLevel as 'low' | 'medium' | 'high' | 'unknown',
    score: freebie.score,
  });

  if (tier !== 'A') {
    throw new Error(
      `Freebie ${freebieId} is not Tier A (tier=${tier}) — only Tier A freebies are eligible for execution.`,
    );
  }

  // ── 5. Policy check (only for real/semi_auto execution) ────────────────
  // Dry-run logs a plan only — no real side effects — so it only needs Tier A.
  // Semi-auto requires isAutoCandidate (tier=A AND AUTO_CLAIM_ENABLED=true).
  // The panic switch in step 2 already blocks semi_auto when AUTO_CLAIM_ENABLED=false,
  // so this check is defense-in-depth for the semi_auto path.
  if (effectiveMode !== 'dry_run') {
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
      env.AUTO_CLAIM_ENABLED,
    );

    if (!policy.isAutoCandidate) {
      throw new Error(
        `Freebie ${freebieId} is not an auto-candidate ` +
        `(tier=${tier}, AUTO_CLAIM_ENABLED=${String(env.AUTO_CLAIM_ENABLED)}).`,
      );
    }
  }

  const claimEmail = env.CLAIM_EMAIL ?? 'clv-claim@example.com';
  const startedAt = new Date();
  let result: ExecutionResult;

  if (effectiveMode === 'dry_run') {
    // ── 6a. Dry-run: log the plan only, no browser, no real side effects ─
    const greyMarker = env.APP_MODE === 'grey' ? ' [app_mode=grey]' : '';
    logger.info(`Dry-run mode — logging plan only, no side effects${greyMarker}`, { freebieId });

    result = {
      success: true,
      stepsLog: [
        `[dry_run] Would navigate to ${freebie.url}`,
        `[dry_run] Would fill email: ${claimEmail}`,
        `[dry_run] Would click submit`,
        ...(env.APP_MODE === 'grey'
          ? ['[dry_run] [app_mode=grey] Grey mode path would be taken']
          : []),
      ],
    };
  } else {
    // ── 6b. Semi-auto: real browser execution ──────────────────────────
    if (env.APP_MODE === 'grey') {
      logger.warn('Executing in GREY mode — this will be logged in ClaimLog', { freebieId });
    }

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

  const finishedAt = new Date();

  // ── 7. ClaimLog — mandatory for every attempt ──────────────────────────
  // Grey mode is prefixed in note for audit trail
  const greyPrefix = env.APP_MODE === 'grey' ? '[app_mode=grey] ' : '';
  const note = `${greyPrefix}${result.stepsLog.join(' | ')}`.slice(0, 500);

  await createClaimLog({
    freebieId,
    status: result.success ? 'success' : 'failed',
    mode: effectiveMode,
    note,
    errorMsg: result.error,
    startedAt,
    finishedAt,
  });

  logger.info('Execution finished', {
    freebieId,
    success: result.success,
    effectiveMode,
    appMode: env.APP_MODE,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  });
  return result;
}
