import type { RawItem } from '../ingestion.types';

export interface FilterResult {
  pass: boolean;
  matchedKeywords: string[];
  reason: 'deal_keyword_match' | 'noise_keyword_blocked' | 'no_deal_keyword';
}

const DEAL_KEYWORDS = [
  // Claim / offer
  'free trial', 'free tier', 'free plan', 'free account',
  'lifetime deal', 'lifetime access', 'lifetime free',
  'free forever', 'always free', 'permanently free',
  'coupon', 'discount code', 'promo code', 'voucher',
  'redeem', 'get for free', 'sign up free',
  'no credit card', 'no card required',
  'limited time', 'limited offer', 'early access',
  'beta access', 'open beta', 'join waitlist',
  'appsumo', 'giveaway', 'giveaways',
  // Launch / new product
  'launch', 'launching', 'we launched', 'just launched', 'launched today',
  'open source', 'self-hosted', 'self hosted',
  'show hn', 'released', 'introducing', 'announcing',
  // Credits / value
  'free credits', '$0', '100% free', 'completely free',
  'free hosting', 'free storage',
  'student plan', 'education plan', 'startup program',
  'aws credits', 'google cloud credits', 'azure credits',
  'github student', 'github education',
  // AI/SaaS specific
  'free api', 'free quota', 'free tokens', 'free requests',
  'open source alternative',
  // Deal explicit
  'deal', 'offer', 'discount', 'promotion', 'free',
];

const NOISE_KEYWORDS = [
  // Tutorial/guide content (unlikely to be a deal)
  'step-by-step tutorial',
  'a guide to',
  'introduction to',
  'deep dive into',
  'best practices for',
  'lessons learned',
  // Personal narrative (not a product launch)
  'ask hn:',
  'tell hn:',
  'why i left',
  'what i learned',
  'in 250 lines',
];

export function filterByKeyword(item: RawItem): FilterResult {
  const content = `${item.title} ${item.description || ''}`.toLowerCase();

  // 1. Check noise keywords first
  const matchedNoise = NOISE_KEYWORDS.filter(kw => content.includes(kw));
  if (matchedNoise.length > 0) {
    return {
      pass: false,
      matchedKeywords: matchedNoise,
      reason: 'noise_keyword_blocked'
    };
  }

  // 2. Check deal keywords
  const matchedDeals = DEAL_KEYWORDS.filter(kw => content.includes(kw));
  if (matchedDeals.length > 0) {
    return {
      pass: true,
      matchedKeywords: matchedDeals,
      reason: 'deal_keyword_match'
    };
  }

  // 3. No match
  return {
    pass: false,
    matchedKeywords: [],
    reason: 'no_deal_keyword'
  };
}
