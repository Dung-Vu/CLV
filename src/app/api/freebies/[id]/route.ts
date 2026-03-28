import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const patchBodySchema = z.object({
  status: z.string().min(1),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const freebie = await prisma.freebie.findUnique({
      where: { id },
      include: { claimLogs: { orderBy: { createdAt: 'desc' } } }
    });
    if (!freebie) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(freebie);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const parsed = patchBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { status } = parsed.data;

    const freebie = await prisma.freebie.findUnique({ where: { id } });
    if (!freebie) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Ensure status creates explicit claim validation hook
    if (status === 'claimed') {
      await prisma.$transaction([
        prisma.freebie.update({
          where: { id },
          data: { status: 'claimed' }
        }),
        prisma.claimLog.create({
          data: {
            freebieId: id,
            status: 'success',
            mode: 'manual',
            note: 'Manual claim triggered from dashboard',
            errorMsg: null,
            startedAt: new Date(),
            finishedAt: new Date()
          }
        })
      ]);
    } else {
      await prisma.freebie.update({
        where: { id },
        data: { status }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    logger.error('PATCH /api/freebies/[id] error', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
