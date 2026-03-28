import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [total, newDeals, tierA, statusCounts] = await Promise.all([
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
      }),
      prisma.freebie.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    const pipeline = { raw: 0, analyzed: 0, ignored: 0, claimed: 0, error: 0 };
    statusCounts.forEach(row => {
      const statusKey = row.status as keyof typeof pipeline;
      if (statusKey in pipeline) {
        pipeline[statusKey] = row._count._all;
      }
    });

    return NextResponse.json({ total, new: newDeals, tierA, pipeline });
  } catch (error) {
    console.error("Failed to fetch header stats:", error);
    return NextResponse.json({ 
      total: 0, 
      new: 0, 
      tierA: 0,
      pipeline: { raw: 0, analyzed: 0, ignored: 0, claimed: 0, error: 0 }
    }, { status: 500 });
  }
}
