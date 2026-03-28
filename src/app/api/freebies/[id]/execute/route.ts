import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { executeFreebieById } from '@/modules/execution/execution.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const result = await executeFreebieById(id);
    logger.info('Execute API completed', {
      freebieId: id,
      success: result.success,
      mode: result.mode,
    });
    return NextResponse.json({
      success: result.success,
      mode: result.mode,
      stepsCompleted: result.stepsCompleted,
      totalSteps: result.totalSteps,
      evidencePaths: result.evidencePaths,
      duration: result.duration,
      error: result.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Execution failed';
    logger.error('Execute API error', { freebieId: id, error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
