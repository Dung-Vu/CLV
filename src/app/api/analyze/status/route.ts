import { NextResponse } from 'next/server';
import { getAnalyzerState } from '@/lib/analyzer-state';

export async function GET() {
  return NextResponse.json(getAnalyzerState());
}
