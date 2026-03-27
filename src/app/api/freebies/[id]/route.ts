import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getFreebieById,
  markClaimed,
  markIgnored,
} from '@/modules/freebies/freebies.service';

const patchSchema = z.object({
  action: z.enum(['claimed', 'ignored']),
  note: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const freebie = await getFreebieById(id);
  if (!freebie) {
    return NextResponse.json({ error: 'Freebie not found' }, { status: 404 });
  }
  return NextResponse.json(freebie);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const { action, note } = parsed.data;
    if (action === 'claimed') {
      await markClaimed(id, note);
    } else {
      await markIgnored(id, note);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
