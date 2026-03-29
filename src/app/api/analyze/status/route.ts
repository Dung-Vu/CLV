import { NextResponse } from 'next/server';
import { getAnalyzerState } from '@/lib/analyzer-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getAnalyzerState());
}
