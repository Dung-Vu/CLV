import type { Browser, Page } from 'playwright';
import type { ExecutionContext, ExecutionResult } from '../execution.types';

const STEP_TIMEOUT_MS = 8_000;
const NAVIGATION_TIMEOUT_MS = 20_000;

/**
 * Runs a basic signup / claim flow for a freebie URL.
 *
 * Strategy:
 *   1. Navigate to the URL.
 *   2. Look for a visible email input and fill it.
 *   3. If there is a password input, fill a random password.
 *   4. Find and click the primary submit button.
 *   5. Wait briefly for a success signal (URL change or success text).
 *
 * All actions are wrapped in try/catch so partial failures are logged
 * without throwing.  The caller decides whether to treat partial success
 * as overall success.
 */
export async function runSignupFlow(
  ctx: ExecutionContext,
  browser: Browser,
): Promise<ExecutionResult> {
  const log: string[] = [];
  const timeout = ctx.stepTimeoutMs ?? STEP_TIMEOUT_MS;

  const page: Page = await browser.newPage();

  try {
    // Step 1 — navigate
    log.push(`Navigating to ${ctx.url}`);
    await page.goto(ctx.url, { timeout: NAVIGATION_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
    log.push(`Page loaded: ${page.url()}`);

    // Step 2 — fill email
    const emailInput = page
      .locator('input[type="email"], input[name*="email"], input[placeholder*="email" i]')
      .first();

    const emailVisible = await emailInput.isVisible({ timeout }).catch(() => false);
    if (emailVisible) {
      await emailInput.fill(ctx.email, { timeout });
      log.push(`Filled email: ${ctx.email}`);
    } else {
      log.push('No visible email input found — skipping fill step');
    }

    // Step 3 — fill password if present
    const passwordInput = page
      .locator('input[type="password"]')
      .first();

    const passwordVisible = await passwordInput.isVisible({ timeout }).catch(() => false);
    if (passwordVisible) {
      const randomPassword = `CLV_${Date.now()}_xK9!`;
      await passwordInput.fill(randomPassword, { timeout });
      log.push('Filled generated password');
    }

    // Step 4 — click submit
    const submitBtn = page
      .locator(
        'button[type="submit"], input[type="submit"], button:has-text("Sign up"), button:has-text("Get started"), button:has-text("Register")',
      )
      .first();

    const submitVisible = await submitBtn.isVisible({ timeout }).catch(() => false);
    if (submitVisible) {
      await submitBtn.click({ timeout });
      log.push('Clicked submit button');
    } else {
      log.push('No submit button found — cannot complete signup');
      return { success: false, error: 'No submit button found', stepsLog: log };
    }

    // Step 5 — wait for post-submit signal (URL change or common success text)
    const urlBefore = page.url();
    await page.waitForTimeout(2_000);
    const urlAfter = page.url();

    if (urlAfter !== urlBefore) {
      log.push(`Redirected to ${urlAfter} — likely success`);
      return { success: true, stepsLog: log };
    }

    const successText = await page
      .locator('body')
      .innerText({ timeout: 3_000 })
      .catch(() => '');

    const successKeywords = ['success', 'thank you', 'welcome', 'confirm', 'cảm ơn', 'thành công'];
    const matched = successKeywords.some((kw) =>
      successText.toLowerCase().includes(kw),
    );

    if (matched) {
      log.push('Detected success keyword on page');
      return { success: true, stepsLog: log };
    }

    log.push('No clear success signal — treating as uncertain');
    return { success: false, error: 'No success signal detected', stepsLog: log };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.push(`Error: ${msg}`);
    return { success: false, error: msg, stepsLog: log };
  } finally {
    await page.close().catch(() => undefined);
  }
}
