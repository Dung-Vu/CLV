import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [total, newDeals, tierA] = await Promise.all([
      prisma.freebie.count(),
      prisma.freebie.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.freebie.count({
        where: {
          tier: 'A',
          status: 'analyzed'
        }
      })
    ]);

    return NextResponse.json({ total, new: newDeals, tierA });
  } catch (error) {
    console.error("Failed to fetch header stats:", error);
    return NextResponse.json({ total: 0, new: 0, tierA: 0 }, { status: 500 });
  }
}
