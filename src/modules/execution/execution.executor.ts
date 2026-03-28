import fs from 'fs';
import path from 'path';

import { chromium } from 'playwright';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import type { ExecutionPlan, ExecutionStep, ExecutorResult } from './execution.types';

const STEP_TIMEOUT_MS = 10_000;
const SCREENSHOT_EVERY_N_STEPS = 3;
const EVIDENCE_BASE = path.join(process.cwd(), 'public', 'evidence');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function takeScreenshot(
  page: import('playwright').Page,
  dir: string,
  label: string,
): Promise<string> {
  ensureDir(dir);
  const filename = `${label}-${Date.now()}.png`;
  const filepath = path.join(dir, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return filepath;
}

function dryRunResult(plan: ExecutionPlan): ExecutorResult {
  logger.info('DRY_RUN — execution plan logged, no browser launched', {
    freebieId: plan.freebieId,
    url: plan.url,
    steps: plan.steps.length,
    estimatedDuration: plan.estimatedDuration,
    requiresManualReview: plan.requiresManualReview,
  });
  return {
    success: true,
    mode: 'dry_run',
    stepsCompleted: 0,
    totalSteps: plan.steps.length,
    evidencePaths: [],
    duration: 0,
  };
}

export async function executePlan(plan: ExecutionPlan): Promise<ExecutorResult> {
  // ── Guard 1: DRY_RUN override ──────────────────────────────────────────
  if (env.EXECUTION_DRY_RUN) {
    return dryRunResult(plan);
  }

  // ── Guard 2: panic switch ──────────────────────────────────────────────
  if (!env.AUTO_CLAIM_ENABLED) {
    throw new Error(
      'Execution blocked: AUTO_CLAIM_ENABLED=false. Set AUTO_CLAIM_ENABLED=true to run real execution.',
    );
  }

  // ── Guard 3: manual review required ───────────────────────────────────
  if (plan.requiresManualReview) {
    throw new Error(
      `Execution blocked: plan requires manual review (freebieId=${plan.freebieId}). Handle this freebie manually.`,
    );
  }

  const startedAt = Date.now();
  const evidenceDir = path.join(EVIDENCE_BASE, plan.freebieId);
  const evidencePaths: string[] = [];

  logger.info('Starting real execution', {
    freebieId: plan.freebieId,
    url: plan.url,
    totalSteps: plan.steps.length,
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let stepsCompleted = 0;

  try {
    for (const step of plan.steps) {
      logger.info(`Step ${step.order}: ${step.description}`, {
        freebieId: plan.freebieId,
        action: step.action,
        selector: step.selector,
      });

      try {
        await runStep(page, step);
        stepsCompleted++;

        // Screenshot every N steps
        if (stepsCompleted % SCREENSHOT_EVERY_N_STEPS === 0) {
          const p = await takeScreenshot(page, evidenceDir, `step-${stepsCompleted}`);
          evidencePaths.push(p);
          logger.info(`Screenshot saved: ${p}`, { freebieId: plan.freebieId });
        }
      } catch (stepErr) {
        const errMsg = stepErr instanceof Error ? stepErr.message : String(stepErr);
        logger.error(`Step ${step.order} failed: ${errMsg}`, {
          freebieId: plan.freebieId,
          action: step.action,
        });

        // Screenshot on error
        try {
          const p = await takeScreenshot(page, evidenceDir, `error-step-${step.order}`);
          evidencePaths.push(p);
        } catch {
          // screenshot failure is non-fatal
        }

        return {
          success: false,
          mode: 'real',
          stepsCompleted,
          totalSteps: plan.steps.length,
          evidencePaths,
          error: `Step ${step.order} (${step.action}): ${errMsg}`,
          duration: Date.now() - startedAt,
        };
      }
    }

    logger.info('Execution completed successfully', {
      freebieId: plan.freebieId,
      stepsCompleted,
    });

    return {
      success: true,
      mode: 'real',
      stepsCompleted,
      totalSteps: plan.steps.length,
      evidencePaths,
      duration: Date.now() - startedAt,
    };
  } finally {
    await browser.close();
  }
}

async function runStep(page: import('playwright').Page, step: ExecutionStep): Promise<void> {
  switch (step.action) {
    case 'navigate': {
      await page.goto(step.value ?? step.selector ?? '', {
        timeout: STEP_TIMEOUT_MS,
        waitUntil: 'domcontentloaded',
      });
      break;
    }
    case 'click': {
      if (!step.selector) throw new Error('click step missing selector');
      await page.locator(step.selector).first().click({ timeout: STEP_TIMEOUT_MS });
      break;
    }
    case 'fill': {
      if (!step.selector) throw new Error('fill step missing selector');
      await page.locator(step.selector).first().fill(step.value ?? '', { timeout: STEP_TIMEOUT_MS });
      break;
    }
    case 'wait': {
      const ms = parseInt(step.value ?? '1000', 10);
      await page.waitForTimeout(ms);
      break;
    }
    case 'screenshot': {
      // explicit screenshot step — taken inline, path not tracked here;
      // caller handles periodic screenshots
      break;
    }
    default: {
      const exhaustive: never = step.action;
      throw new Error(`Unknown step action: ${exhaustive}`);
    }
  }
}
