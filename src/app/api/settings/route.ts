import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    
    let prefs = await prisma.userPrefs.findFirst();
    if (!prefs) {
      prefs = await prisma.userPrefs.create({ data: body });
    } else {
      prefs = await prisma.userPrefs.update({
        where: { id: prefs.id },
        data: body
      });
    }

    return NextResponse.json(prefs);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
