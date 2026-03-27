# CLV — AI-Powered Global Freebies Hunter

> **Tự động săn, phân tích và claim các chương trình free, trial, promo từ khắp nơi trên thế giới.**

---

## 🎯 Mục Tiêu

CLV là công cụ cá nhân giúp tự động:
- **Phát hiện** các chương trình free/promo AI tools, SaaS trials, referral bonuses toàn cầu
- **Phân tích** bằng AI: giá trị thực, điều kiện nhận, rủi ro, độ ưu tiên
- **Thông báo** ngay khi có deal ngon phù hợp
- **Scale** dễ dàng sang nhiều lĩnh vực (voucher đồ ăn, ecommerce, v.v.)

---

## 🧠 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────┐
│                   CLV SYSTEM                        │
├─────────────┬───────────────┬───────────────────────┤
│   SCANNER   │  AI ANALYZER  │      DASHBOARD        │
│  (Cron Job) │  (LLM Engine) │    (Next.js 15)       │
└──────┬──────┴───────┬───────┴──────────┬────────────┘
       │              │                  │
       ▼              ▼                  ▼
  RSS/Twitter    Classify &         View + Filter
  Reddit/PH      Score Deal         Claimed Log
  Telegram       VN-eligible?       Expiry Alert
```

---

## 🔍 Nguồn Dữ Liệu

| Nguồn | Loại | Ví Dụ |
|-------|------|-------|
| RSS Feeds | Freebies toàn cầu | FreebieShark, Hip2Save |
| Reddit API | Community deals | r/Freebies, r/deals |
| ProductHunt | AI/SaaS promos | Launch day free tiers |
| Twitter/X | Giveaways realtime | #AItools #free |
| Telegram | VN-specific | Group Săn Sale VN |
| Manual seeds | High-value targets | Perplexity Pro, Gemini Ultra |

---

## ⚙️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Backend | Next.js API Routes + Node-cron |
| Database | PostgreSQL + Prisma ORM |
| AI Engine | Ollama (local LLM) / Groq API |
| Scraping | Puppeteer + Cheerio |
| Auth | iron-session |
| Deploy | Self-hosted VPS + PM2 + Nginx |

---

## 🗄️ Database Schema (Core)

```prisma
model Freebie {
  id          String   @id @default(cuid())
  title       String
  source      String   // reddit, rss, twitter...
  value_usd   Float?   // giá trị ước tính
  expiry      DateTime?
  claim_url   String
  steps       String?  // hướng dẫn claim
  eligible_vn Boolean  @default(false)
  risk_level  String   // low / medium / high
  score       Float    // AI ranking score
  status      String   @default("new") // new/claimed/expired
  category    String   // ai-tool / saas / food / referral
  created_at  DateTime @default(now())
}

model UserPrefs {
  id            String   @id @default(cuid())
  min_value_usd Float    @default(20)
  categories    String[] // ["ai-tool", "saas"]
  auto_claim    Boolean  @default(false)
}
```

---

## 🤖 AI Analyzer Prompt (Core Logic)

Mỗi freebie mới được LLM phân tích theo template:

```
Analyze this promotion:
Title: {title}
Description: {description}

Return JSON:
{
  "value_usd": number,
  "expiry": "YYYY-MM-DD or null",
  "eligible_vn": boolean,
  "risk_level": "low|medium|high",
  "claim_steps": ["step1", "step2"],
  "score": 0-100,
  "summary_vi": "mô tả ngắn tiếng Việt"
}
```

---

## 📦 Roadmap

### Phase 1 — MVP Scanner (Tuần 1)
- [ ] Setup Next.js 15 + Prisma + Postgres
- [ ] RSS/Reddit scanner cron job
- [ ] AI analyzer (Groq free tier)
- [ ] Dashboard cơ bản: list + filter

### Phase 2 — Auto Claim (Tuần 2)
- [ ] Puppeteer auto-signup (burner email)
- [ ] Referral chain automation
- [ ] Proxy rotation support

### Phase 3 — Scale (Tuần 3+)
- [ ] Thêm category: food vouchers (Shopee, Grab)
- [ ] Multi-country targeting
- [ ] AI personalization theo lịch sử claim

---

## ⚠️ Disclaimer

Dự án cá nhân, chỉ dùng cho mục đích cá nhân. Tuân thủ ToS từng platform. Không dùng cho mục đích thương mại.

---

*Built with ❤️ in Ho Chi Minh City, Vietnam*
