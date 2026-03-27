import type { SourceKind, SourcePriority, SourceTrustLevel } from '@/types';

export interface SourceConfig {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  enabled: boolean;
  priority: SourcePriority;
  trustLevel: SourceTrustLevel;
  tags: string[];
  notes?: string;
}

/** Initial sources — enable 6-8 low-risk, high-quality sources first */
export const SOURCES: SourceConfig[] = [
  {
    id: 'hackernews-rss',
    name: 'Hacker News',
    kind: 'rss',
    url: 'https://news.ycombinator.com/rss',
    enabled: true,
    priority: 'medium',
    trustLevel: 'medium',
    tags: ['dev', 'ai', 'saas', 'launch'],
    notes: 'Good for dev tools and AI launches, needs strong scoring to filter noise',
  },
  {
    id: 'producthunt-rss',
    name: 'Product Hunt',
    kind: 'rss',
    url: 'https://www.producthunt.com/feed',
    enabled: true,
    priority: 'high',
    trustLevel: 'high',
    tags: ['ai', 'saas', 'launch'],
    notes: 'Best for AI/SaaS launches with deal offers',
  },
  {
    id: 'betalist-rss',
    name: 'BetaList',
    kind: 'rss',
    url: 'https://betalist.com/feed',
    enabled: true,
    priority: 'medium',
    trustLevel: 'medium',
    tags: ['startup', 'early-access', 'saas'],
    notes: 'Early-access deals, variable quality',
  },
  {
    id: 'dev-to-rss',
    name: 'DEV.to — free tools tag',
    kind: 'rss',
    url: 'https://dev.to/feed/tag/freetools',
    enabled: false,
    priority: 'low',
    trustLevel: 'medium',
    tags: ['dev', 'tools', 'freetools'],
    notes: 'Dev community posts about free tools',
  },
  {
    id: 'github-blog-rss',
    name: 'GitHub Blog',
    kind: 'rss',
    url: 'https://github.blog/feed/',
    enabled: true,
    priority: 'high',
    trustLevel: 'high',
    tags: ['dev', 'credits', 'official'],
    notes: 'GitHub Education, Copilot updates, free tiers',
  },
  {
    id: 'aws-blog-rss',
    name: 'AWS News Blog',
    kind: 'rss',
    url: 'https://aws.amazon.com/blogs/aws/feed/',
    enabled: false,
    priority: 'medium',
    trustLevel: 'high',
    tags: ['cloud', 'credits', 'official'],
    notes: 'AWS free tier announcements, credit programs',
  },
  // ── Education & DevTools ──────────────────────────────────────────────
  {
    id: 'jetbrains-blog-rss',
    name: 'JetBrains Blog',
    kind: 'rss',
    url: 'https://blog.jetbrains.com/feed/',
    enabled: true,
    priority: 'medium',
    trustLevel: 'high',
    tags: ['devtools', 'education', 'official'],
    notes: 'JetBrains free licenses, student programs, new free-tier tools',
  },
  {
    id: 'github-education-blog',
    name: 'GitHub Education Blog',
    kind: 'rss',
    url: 'https://github.blog/tag/education/feed/',
    enabled: true,
    priority: 'high',
    trustLevel: 'high',
    tags: ['education', 'devtools', 'credits', 'official'],
    notes: 'GitHub Student Developer Pack updates, free credits for students',
  },
  // ── Gaming ────────────────────────────────────────────────────────────
  {
    id: 'epicgames-free-rss',
    name: 'Epic Games Free Games',
    kind: 'rss',
    url: 'https://store.epicgames.com/en-US/free-games',
    enabled: false,
    priority: 'medium',
    trustLevel: 'high',
    tags: ['gaming', 'official'],
    notes: 'Epic weekly free games — needs HTML scraper, not RSS',
  },
  // ── Ecommerce / Voucher VN ─────────────────────────────────────────────
  {
    id: 'mmo4me-rss',
    name: 'MMO4ME — Deals & Vouchers',
    kind: 'rss',
    url: 'https://mmo4me.com/forums/-/index.rss',
    enabled: false,
    priority: 'medium',
    trustLevel: 'medium',
    tags: ['voucher', 'ecommerce', 'vn'],
    notes: 'Vietnamese deal community — variable quality, enable cautiously',
  },
];
