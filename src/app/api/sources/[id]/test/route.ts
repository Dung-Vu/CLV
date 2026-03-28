import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const source = await prisma.sourceConfig.findUnique({ where: { id: params.id } });
    if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    
    // Mock simulation wait for test
    await new Promise(r => setTimeout(r, 1500));
    
    return NextResponse.json({
      success: true,
      message: 'TEST OK ✓',
      itemsFound: Math.floor(Math.random() * 20) + 1,
      sampleTitle: `[MOCK] Ingestion item from ${source.name}`
    });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
