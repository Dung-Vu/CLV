import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { enabled } = await req.json();
    await prisma.sourceConfig.update({
      where: { id: params.id },
      data: { enabled }
    });
    return NextResponse.json({ success: true });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
