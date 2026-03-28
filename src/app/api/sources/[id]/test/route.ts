import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const source = await prisma.sourceConfig.findUnique({ where: { id } });
    if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    
    // Mock simulation wait for test
    await new Promise(r => setTimeout(r, 1500));
    
    return NextResponse.json({
      success: true,
      message: 'TEST OK ✓',
      itemsFound: Math.floor(Math.random() * 20) + 1,
      sampleTitle: `[MOCK] Ingestion item from ${source.name}`
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
