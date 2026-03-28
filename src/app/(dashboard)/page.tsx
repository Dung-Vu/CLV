import { TerminalCard } from "@/components/ui/TerminalCard";
import { StatusDot } from "@/components/ui/StatusDot";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { Badge } from "@/components/ui/Badge";
import { ScoreDistributionChart } from "@/components/charts/ScoreDistributionChart";
import { TierBreakdownChart } from "@/components/charts/TierBreakdownChart";
import { DailyIngestionChart } from "@/components/charts/DailyIngestionChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PipelineWidget } from "@/components/dashboard/PipelineWidget";
import { EmptyNoFreebies } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getTranslation } from "@/lib/i18n/dict";

export default async function CommandCenter() {
  const prefs = await prisma.userPrefs.findFirst();
  const lang = (prefs?.language as 'vi' | 'en') || 'vi';
  const t = (path: string) => getTranslation(lang, path);

  const totalFreebies = await prisma.freebie.count();

  if (totalFreebies === 0) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
        <TerminalCard title={t('dashboard.systemStatus')} borderColor="var(--accent-green)">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
            <div className="flex items-center gap-3">
              <StatusDot status="online" className="shrink-0" />
              <span className="font-mono text-xs text-[var(--text-primary)] tracking-wide">
                INGESTION <span className="text-[var(--accent-green)] ml-1">[ONLINE]</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot status="standby" className="shrink-0" />
              <span className="font-mono text-xs text-[var(--text-primary)] tracking-wide">
                ANALYZER <span className="text-[var(--accent-yellow)] ml-1">[STANDBY]</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <StatusDot status="locked" className="shrink-0" />
              <span className="font-mono text-xs text-[var(--text-primary)] tracking-wide">
                EXECUTION <span className="text-[var(--accent-red)] ml-1">[LOCKED]</span>
              </span>
            </div>
          </div>
        </TerminalCard>
        <EmptyNoFreebies />
      </div>
    );
  }

  // Quick stats
  const tierAReady = await prisma.freebie.count({
    where: { tier: 'A', status: { in: ['raw', 'analyzed'] } }
  });

  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  const analyzedToday = await prisma.freebie.count({
    where: { status: 'analyzed', updatedAt: { gte: startOfDay } }
  });

  const claimedTotal = await prisma.freebie.count({
    where: { status: 'claimed' }
  });

  // Recent Tier A
  const recentDeals = await prisma.freebie.findMany({
    where: { tier: 'A', status: { not: 'ignored' } },
    orderBy: { score: 'desc' },
    take: 5
  });

  // Charts data
  const freebiesWithScore = await prisma.freebie.findMany({
    where: { score: { gte: 0 } },
    select: { score: true }
  });
  const scoreStats = { "0-30": 0, "31-50": 0, "51-70": 0, "71-90": 0, "91-100": 0 };
  freebiesWithScore.forEach(f => {
    if (f.score !== null) {
      if (f.score <= 30) scoreStats["0-30"]++;
      else if (f.score <= 50) scoreStats["31-50"]++;
      else if (f.score <= 70) scoreStats["51-70"]++;
      else if (f.score <= 90) scoreStats["71-90"]++;
      else scoreStats["91-100"]++;
    }
  });
  const scoreData = Object.entries(scoreStats).map(([range, count]) => ({ range, count }));

  const tierCountsRaw = await prisma.freebie.groupBy({
    by: ['tier'],
    _count: { id: true },
    where: { tier: { not: null } }
  });
  const tierData = tierCountsRaw.map(t => ({
    name: `Tier ${t.tier}`,
    value: t._count.id,
    fill: t.tier === 'A' ? 'var(--accent-green)' : t.tier === 'B' ? 'var(--accent-yellow)' : 'var(--accent-red)'
  }));

  const pipelineRaw = await prisma.freebie.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  const pipelineStats = { raw: 0, analyzed: 0, ignored: 0, error: 0, claimed: 0 };
  pipelineRaw.forEach(row => {
    const statusKey = row.status as keyof typeof pipelineStats;
    if (statusKey in pipelineStats) {
      pipelineStats[statusKey] = row._count.id;
    }
  });

  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const dailyRaw = await prisma.freebie.findMany({
    where: { createdAt: { gte: last7Days } },
    select: { createdAt: true }
  });
  const dailyStats: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    dailyStats[d.toISOString().split('T')[0]] = 0;
  }
  dailyRaw.forEach(f => {
    const day = f.createdAt.toISOString().split('T')[0];
    if (dailyStats[day] !== undefined) dailyStats[day]++;
  });
  const dailyData = Object.entries(dailyStats).map(([date, count]) => {
    const d = new Date(date);
    return { name: `${d.getMonth()+1}/${d.getDate()}`, count };
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      
      {/* PANEL 1: SYSTEM STATUS */}
      <TerminalCard title={t('dashboard.systemStatus')} borderColor="var(--accent-green)">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
          <div className="flex items-center gap-3">
            <StatusDot status="online" className="shrink-0" />
            <span className="font-mono text-xs text-[var(--text-primary)] tracking-wide">
              INGESTION <span className="text-[var(--accent-green)] ml-1">[ONLINE]</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StatusDot status="standby" className="shrink-0" />
            <span className="font-mono text-xs text-[var(--text-primary)] tracking-wide">
              ANALYZER <span className="text-[var(--accent-yellow)] ml-1">[STANDBY]</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StatusDot status="locked" className="shrink-0" />
            <span className="font-mono text-xs text-[var(--text-primary)] tracking-wide">
              EXECUTION <span className="text-[var(--accent-red)] ml-1">[LOCKED]</span>
            </span>
          </div>
        </div>
      </TerminalCard>

      {/* PANEL 2: QUICK STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.totalProcessed'), value: totalFreebies.toLocaleString(), color: "var(--accent-green)" },
          { label: t('dashboard.tierADeals'), value: tierAReady.toLocaleString(), icon: "▲", color: "var(--accent-green)" },
          { label: t('dashboard.pendingReview'), value: analyzedToday.toLocaleString(), color: "var(--accent-blue)" },
          { label: t('logs.statsClaims'), value: claimedTotal.toLocaleString(), color: "var(--accent-yellow)" },
        ].map((stat, i) => (
          <TerminalCard key={i} borderColor={stat.color} glowOnHover>
            <div className="flex flex-col justify-between h-full">
              <span className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-wider group-hover:text-[var(--text-muted)] transition-colors">
                {stat.label}
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span 
                  className="font-mono text-3xl font-light tracking-tight" 
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </span>
                {stat.icon && (
                  <span className="text-[var(--accent-green)] text-xs animate-bounce">{stat.icon}</span>
                )}
              </div>
            </div>
          </TerminalCard>
        ))}
      </section>

      {/* PANEL 3: PIPELINE STATUS */}
      <section>
        <PipelineWidget pipeline={pipelineStats} />
      </section>

      {/* PANEL 5: DATA VISUALIZATION */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TerminalCard title={t('detail.scoreBreakdown')} borderColor="var(--text-dim)">
          <ScoreDistributionChart data={scoreData} />
        </TerminalCard>
        
        <TerminalCard title={t('dashboard.tierBreakdown')} borderColor="var(--text-dim)">
          <TierBreakdownChart data={tierData} />
        </TerminalCard>

        <TerminalCard title={t('dashboard.dailyIngestion')} borderColor="var(--text-dim)">
          <DailyIngestionChart data={dailyData} />
        </TerminalCard>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL 3: RECENT TIER A (60%) */}
        <div className="lg:col-span-7 flex flex-col">
          <TerminalCard title={t('dashboard.readyToClaim')} borderColor="var(--accent-green)" className="h-full">
            <div className="flex flex-col flex-1 -m-3 sm:-m-4 divide-y divide-[var(--border-subtle)]">
              {recentDeals.length === 0 ? (
                <div className="p-10 font-mono text-center text-xs text-[var(--text-dim)]">
                  {t('dashboard.noPending')}
                </div>
              ) : (
                recentDeals.map((deal) => (
                  <Link 
                    href={`/freebies/${deal.id}`}
                    key={deal.id} 
                    className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between hover:bg-[rgba(0,255,136,0.02)] transition-colors group"
                  >
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={deal.score || 0} />
                        <Badge variant="category">{deal.category}</Badge>
                      </div>
                      <h3 className="text-[var(--text-primary)] font-medium text-sm truncate max-w-[300px] sm:max-w-[400px]">
                         {deal.title}
                      </h3>
                    </div>
                    
                    {deal.status !== 'claimed' && (
                      <div 
                        className="shrink-0 text-[var(--accent-green)] font-mono text-xs font-bold border border-[var(--accent-green)] rounded px-4 py-1.5 hover:bg-[var(--accent-green)] hover:text-black transition-colors"
                      >
                        → VERIFY
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </TerminalCard>
        </div>

        {/* PANEL 4: QUICK ACTIONS (40%) */}
        <div id="quick-actions-panel" className="lg:col-span-5 flex flex-col h-fit">
          <TerminalCard title={t('dashboard.actions')} borderColor="var(--accent-blue)">
            <QuickActions />
          </TerminalCard>
        </div>

      </div>
    </div>
  );
}
