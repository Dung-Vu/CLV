import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listFreebies } from '@/modules/freebies/freebies.service';
import type { FreebieStatus } from '@/types';

const VALID_STATUSES: FreebieStatus[] = [
  'raw', 'analyzed', 'claimed', 'ignored', 'expired', 'analysis_error',
];

const querySchema = z.object({
  status: z.string().optional().transform((v) => {
    if (!v) return undefined;
    return VALID_STATUSES.includes(v as FreebieStatus) ? (v as FreebieStatus) : undefined;
  }),
  minScore: z.coerce.number().optional(),
  category: z.string().optional(),
  tier: z.enum(['A', 'B', 'C']).optional(),
  search: z.string().optional(),
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
    const result = await listFreebies(query.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch freebies' }, { status: 500 });
  }
}
