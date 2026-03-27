import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Sends a Telegram message via the Bot API.
 * Silently skips if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID are not set.
 */
export async function sendTelegramAlert(message: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    logger.debug('Telegram alert skipped — credentials not configured');
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      logger.warn('Telegram alert delivery failed', { status: res.status, body });
    } else {
      logger.info('Telegram alert sent');
    }
  } catch (err) {
    logger.warn('Telegram alert network error', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Formats and sends a pipeline health alert.
 * Called by SupervisorAgent when anomalies are detected.
 */
export async function sendPipelineAlert(opts: {
  errorCount: number;
  rawBacklog: number;
  estimatedValue: number;
}): Promise<void> {
  const lines: string[] = ['🤖 <b>CLV Pipeline Alert</b>'];

  if (opts.errorCount > 5) {
    lines.push(`⚠️ Analysis errors: <b>${opts.errorCount}</b> — check LLM quota`);
  }
  if (opts.rawBacklog > 50) {
    lines.push(`📥 High raw backlog: <b>${opts.rawBacklog}</b> items pending`);
  }
  lines.push(`💰 Estimated claimable value: <b>$${opts.estimatedValue.toFixed(0)}</b>`);

  await sendTelegramAlert(lines.join('\n'));
}
