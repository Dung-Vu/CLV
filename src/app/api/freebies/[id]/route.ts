import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const freebie = await prisma.freebie.findUnique({
      where: { id: params.id },
      include: { claimLogs: { orderBy: { createdAt: 'desc' } } }
    });
    if (!freebie) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(freebie);
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status } = body;

    const freebie = await prisma.freebie.findUnique({ where: { id: params.id } });
    if (!freebie) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Ensure status creates explicit claim validation hook
    if (status === 'claimed') {
      await prisma.$transaction([
        prisma.freebie.update({
          where: { id: params.id },
          data: { status: 'claimed' }
        }),
        prisma.claimLog.create({
          data: {
            freebieId: params.id,
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
        where: { id: params.id },
        data: { status }
      });
    }

    return NextResponse.json({ success: true });
  } catch(e: any) {
    logger.error('PATCH /api/freebies/[id] error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
