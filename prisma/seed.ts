import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SOURCES = [
  {
    name: 'Hacker News',
    kind: 'rss',
    url: 'https://news.ycombinator.com/rss',
    enabled: true,
    priority: 'medium',
    trustLevel: 'medium',
    tags: ['dev', 'ai', 'saas', 'launch'],
    notes: 'Tốt cho dev tools, AI tools mới. Cần scoring tốt để lọc noise.',
  },
  {
    name: 'Product Hunt',
    kind: 'rss',
    url: 'https://www.producthunt.com/feed',
    enabled: true,
    priority: 'high',
    trustLevel: 'high',
    tags: ['ai', 'saas', 'launch'],
    notes: 'Tốt cho AI/SaaS mới có deal launch.',
  },
  {
    name: 'BetaList',
    kind: 'rss',
    url: 'https://betalist.com/feed',
    enabled: true,
    priority: 'medium',
    trustLevel: 'medium',
    tags: ['startup', 'early-access', 'saas'],
    notes: 'Early-access và credits discovery.',
  },
  {
    name: 'DEV.to — Free Tools',
    kind: 'rss',
    url: 'https://dev.to/feed/tag/freetools',
    enabled: false,
    priority: 'low',
    trustLevel: 'medium',
    tags: ['dev', 'tools', 'freetools'],
    notes: 'Community posts về free tools. Chất lượng không đồng đều.',
  },
  {
    name: 'GitHub Blog',
    kind: 'rss',
    url: 'https://github.blog/feed/',
    enabled: true,
    priority: 'high',
    trustLevel: 'high',
    tags: ['dev', 'credits', 'official'],
    notes: 'GitHub Education, Copilot updates, free tiers.',
  },
  {
    name: 'GitHub Education Blog',
    kind: 'rss',
    url: 'https://github.blog/tag/education/feed/',
    enabled: true,
    priority: 'high',
    trustLevel: 'high',
    tags: ['education', 'devtools', 'credits', 'official'],
    notes: 'Student Developer Pack updates, free credits for students.',
  },
  {
    name: 'JetBrains Blog',
    kind: 'rss',
    url: 'https://blog.jetbrains.com/feed/',
    enabled: true,
    priority: 'medium',
    trustLevel: 'high',
    tags: ['devtools', 'education', 'official'],
    notes: 'JetBrains free licenses, student programs.',
  },
  {
    name: 'AWS News Blog',
    kind: 'rss',
    url: 'https://aws.amazon.com/blogs/aws/feed/',
    enabled: false,
    priority: 'medium',
    trustLevel: 'high',
    tags: ['cloud', 'credits', 'official'],
    notes: 'AWS free tier announcements, credit programs.',
  },
  {
    name: 'Vercel Blog',
    kind: 'rss',
    url: 'https://vercel.com/blog/rss.xml',
    enabled: false,
    priority: 'medium',
    trustLevel: 'high',
    tags: ['devtools', 'cloud', 'official'],
    notes: 'Vercel free tier updates, Next.js announcements.',
  },
  {
    name: 'Supabase Blog',
    kind: 'rss',
    url: 'https://supabase.com/blog/rss.xml',
    enabled: false,
    priority: 'medium',
    trustLevel: 'high',
    tags: ['cloud', 'devtools', 'official'],
    notes: 'Supabase free tier, credits, new features.',
  },
  {
    name: "There's An AI For That",
    kind: 'rss',
    url: 'https://theresanaiforthat.com/rss/',
    enabled: false,
    priority: 'high',
    trustLevel: 'medium',
    tags: ['ai', 'curated', 'tools'],
    notes: 'Curated AI tool directory. Filter cho free/freemium.',
  },
  {
    name: 'SaaSHub — Free Alternatives',
    kind: 'html',
    url: 'https://www.saashub.com/free',
    enabled: false,
    priority: 'medium',
    trustLevel: 'medium',
    tags: ['saas', 'curated', 'alternatives'],
    notes: 'Free tools và alternative pages.',
  },
  {
    name: 'Epic Games Free Games',
    kind: 'html',
    url: 'https://store.epicgames.com/en-US/free-games',
    enabled: false,
    priority: 'medium',
    trustLevel: 'high',
    tags: ['gaming', 'official'],
    notes: 'No RSS — cần HTML collector.',
  },
  {
    name: 'MMO4ME — Deals & Vouchers',
    kind: 'rss',
    url: 'https://mmo4me.com/forums/-/index.rss',
    enabled: false,
    priority: 'medium',
    trustLevel: 'medium',
    tags: ['voucher', 'ecommerce', 'vn'],
    notes: 'Deals và vouchers VN. Enable thận trọng.',
  },
  {
    name: 'Reddit — r/SaaS',
    kind: 'reddit',
    url: 'https://www.reddit.com/r/SaaS/.rss',
    enabled: false,
    priority: 'medium',
    trustLevel: 'medium',
    tags: ['community', 'saas', 'launch'],
    notes: 'Founder promos và launch deals. Noise cao.',
  },
  {
    name: 'Reddit — r/SideProject',
    kind: 'reddit',
    url: 'https://www.reddit.com/r/SideProject/.rss',
    enabled: false,
    priority: 'low',
    trustLevel: 'medium',
    tags: ['community', 'launch', 'saas'],
    notes: 'Indie launches kèm promo codes.',
  },
  {
    name: 'Reddit — r/Entrepreneur',
    kind: 'reddit',
    url: 'https://www.reddit.com/r/Entrepreneur/.rss',
    enabled: false,
    priority: 'low',
    trustLevel: 'medium',
    tags: ['community', 'saas', 'deals'],
    notes: 'Occasional deal posts từ founders.',
  },
];

async function main() {
  console.log('Seeding default sources...');

  let created = 0;
  let skipped = 0;

  for (const source of DEFAULT_SOURCES) {
    const existing = await prisma.sourceConfig.findFirst({ where: { url: source.url } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.sourceConfig.create({ data: source });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already exists): ${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
