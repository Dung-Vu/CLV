import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { listFreebies } from '@/modules/freebies/freebies.service';

const querySchema = z.object({
  status: z
    .enum(['raw', 'analyzed', 'claimed', 'ignored', 'expired', 'analysis_error'])
    .optional(),
  minScore: z.coerce.number().optional(),
  category: z.string().optional(),
  tier: z.enum(['A', 'B', 'C']).optional(),
  tiers: z.string().optional(),
  dealsOnly: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: z.string().optional(),
  sort: z.enum(['score', 'createdAt', 'valueUsd']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = querySchema.safeParse(params);
    if (!query.success) {
      return NextResponse.json(
        { error: 'Invalid query params', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const tiers = query.data.tiers
      ?.split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is 'A' | 'B' | 'C' => ['A', 'B', 'C'].includes(value));

    const result = await listFreebies({
      ...query.data,
      tiers: tiers && tiers.length > 0 ? tiers : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    logger.error('GET /api/freebies error', { error: err instanceof Error ? err.message : err });
    return NextResponse.json(
      { error: 'Failed to fetch freebies', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
