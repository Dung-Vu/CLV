import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import type { Freebie } from '@prisma/client';

export async function sendTelegramMessage(message: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    logger.warn('[TELEGRAM] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing. Skipping alert.');
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`[TELEGRAM] Failed to send message: ${response.status} ${response.statusText}`, { errorData });
    } else {
      logger.info('[TELEGRAM] Message sent successfully');
    }
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.error('[TELEGRAM] Error sending message', { error: errMessage });
  }
}

export function formatTierAAlert(deals: Freebie[]): string {
  if (!deals || deals.length === 0) return '';

  let message = `🚨 <b>CLV ALERT — ${deals.length} TIER A DEALS</b>\n\n`;

  for (const deal of deals) {
    const valueStr = deal.valueUsd ? `$${deal.valueUsd}` : '$0';
    message += `🎯 <b>${deal.title}</b>\n`;
    message += `💰 ${valueStr} | ⚡ ${deal.score || 0}/100\n`;
    message += `🔗 <a href="${deal.url}">CLAIM NOW</a>\n`;
    message += `─────────────────\n`;
  }

  return message;
}

export async function sendPipelineAlert(data: { errorCount: number; rawBacklog: number; estimatedValue: number }): Promise<void> {
  const message = `🚨 <b>PIPELINE ANOMALY DETECTED</b>\n\n` +
    `⚠️ <b>Analysis Errors:</b> ${data.errorCount}\n` +
    `📥 <b>Raw Backlog:</b> ${data.rawBacklog}\n` +
    `💰 <b>Estimated Value Pending:</b> $${data.estimatedValue.toFixed(0)}\n\n` +
    `Please check the CLV Dashboard immediately.`;
  await sendTelegramMessage(message);
}