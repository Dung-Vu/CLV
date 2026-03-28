import type { AnalyzerInput } from './analyzer.types';

export const ANALYZER_VERSION = 'analyzer-v2';

export function buildAnalyzerPrompt(input: AnalyzerInput): string {
  return `You are an analyzer for CLV, a personal self-hosted AI system that hunts freebies, trials, and promotions.

Your job is to analyze one promotion and return ONLY valid JSON.

Context:
- The end user is a single personal user in Vietnam.
- Prioritize realistic usability, low risk, and clear value.
- Be conservative when information is missing.
- Do not invent facts.
- If a field cannot be inferred reliably, use null, false, "unknown", or a lower score.

Analyze this promotion:
Title: ${input.title}
Source: ${input.source}
URL: ${input.url}
Description: ${input.description ?? 'N/A'}

Return JSON with exactly these fields:
{
  "value_usd": number | null,
  "expiry": "YYYY-MM-DD" | null,
  "eligible_vn": boolean,
  "risk_level": "low" | "medium" | "high" | "unknown",
  "category": "ai-tool" | "saas" | "cloud" | "voucher" | "other",
  "score": number,
  "summary_vi": string,
  "steps": string[],
  "card_required": boolean,
  "kyc_required": boolean,
  "friction_level": "low" | "medium" | "high" | "unknown",
  "tier_hint": "A" | "B" | "C",
  "is_deal": boolean,
  "deal_evidence": string
}

PHAN BIET DEAL VOI NOI DUNG THONG THUONG:

Chi danh dau is_deal = true khi co mot offer cu the ma nguoi dung co the claim, dang ky, kich hoat, redeem, hoac nhan duoc ngay.

Day la DEAL hop le:
- Free trial SaaS co thoi han ro rang: "14-day trial", "30 days free", "3 months Pro free"
- Cloud credits that: "$100 credits", "$300 for new users", "free compute credits"
- Lifetime deal / AppSumo / one-time promotional pricing
- Free tier co gioi han usage ro rang: "10k API calls/month", "5 GB storage free", "3 seats free"
- Coupon code, promo code, voucher, discount campaign
- Free account co tinh nang premium ro rang va co cach kich hoat cu the

Khong phai DEAL, phai dat is_deal = false:
- Bai viet ky thuat, tutorial, how-to guide, docs article
- Blog post chia se kinh nghiem, review, comparison, case study
- Open-source project, GitHub repo, framework, library, truyen thong ky thuat
- News, launch announcement, changelog, release note khong co offer cu the
- Bai viet noi mot tool la "free" nhung khong noi ro free cai gi, usage limit gi, claim the nao
- Bai viet gioi thieu mot tool, nhung khong phai offer tu chinh tool do

QUY TAC XAC DINH is_deal:
- is_deal = true CHI KHI co bang chung cu the de claim/dang ky/redeem.
- deal_evidence phai tom tat ngan gon bang chung do, vi du:
  - "Free trial 14 ngay, khong can the"
  - "$100 credits cho tai khoan moi"
  - "Coupon SAVE50 giam 50% cho goi Pro"
  - "Free tier 10000 API calls moi thang"
- Neu KHONG tim thay bang chung cu the de claim, deal_evidence phai la chuoi rong va is_deal = false.
- Neu noi dung chi la bai viet, huong dan, repo, announcement, discussion, hoac mo ta chung chung, is_deal = false.
- Khong duoc doan. Khong duoc coi mot tool la deal chi vi no co ve mien phi.

RANG BUOC BAT BUOC:
- Neu is_deal = false thi score phai = 0.
- Neu is_deal = false thi tier_hint phai = "C".
- Neu deal_evidence la rong, mo ho, hoac khong cho thay offer cu the thi is_deal phai = false.

Field guidance:
- value_usd: estimated monetary value in USD, conservative estimate only.
- expiry: only if clearly inferable from the text.
- eligible_vn: true only if a user in Vietnam can realistically claim/use it.
- risk_level: consider payment risk, account risk, unclear conditions, region restrictions, and possible ToS concerns.
- category: choose the closest category.
- score: integer from 0 to 100; higher means more worthwhile for this user.
- summary_vi: short Vietnamese summary, practical and concise.
- steps: short Vietnamese steps to claim or activate.
- card_required: true if payment card is likely required.
- kyc_required: true if identity verification is likely required.
- friction_level: estimate effort and complexity to claim.
- tier_hint:
  - A: low-risk, no-card or low-friction, realistic for Vietnam
  - B: some friction or card/eligibility caution
  - C: high risk, unclear, restrictive, or low-confidence
- is_deal: VERY IMPORTANT. Set to true ONLY if this is an actual actionable offer with a specific thing to claim, sign up for, redeem, or activate.
- deal_evidence: short concrete evidence proving why this is a real deal. Empty string if no concrete offer exists.

Important rules:
- Return ONLY JSON.
- Do not wrap JSON in markdown.
- Do not include explanation outside the JSON.
- Keep summary_vi short.
- Keep each step short and actionable.
- Be strict and conservative. When in doubt, set is_deal=false, score=0, tier_hint="C", deal_evidence="".`;
}
