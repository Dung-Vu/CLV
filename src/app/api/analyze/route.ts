import { NextResponse } from 'next/server';
import { analyzePendingFreebies } from '@/modules/analyzer/analyzer.service';
import { logger } from '@/lib/logger';

export async function POST() {
  logger.info('Manual analyzer triggered via API');
  try {
    const result = await analyzePendingFreebies(20);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    logger.error('Manual analyzer failed', { error: err });
    return NextResponse.json({ error: 'Analyzer failed' }, { status: 500 });
  }
}
