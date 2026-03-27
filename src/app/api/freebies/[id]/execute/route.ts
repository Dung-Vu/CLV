import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { executeFreebie } from '@/modules/execution/execution.service';

const bodySchema = z.object({
  mode: z.enum(['dry_run', 'semi_auto']).default('dry_run'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Guard: never allow real execution when AUTO_CLAIM_ENABLED=false
  if (!env.AUTO_CLAIM_ENABLED && !env.EXECUTION_DRY_RUN) {
    return NextResponse.json(
      { error: 'Execution is disabled. Set AUTO_CLAIM_ENABLED=true to enable.' },
      { status: 403 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { mode } = parsed.data;

  try {
    const result = await executeFreebie(id, mode);
    logger.info('Execute API called', { freebieId: id, mode, success: result.success });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Execution failed';
    logger.error('Execute API error', { freebieId: id, error: message });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
