# CLV Sources Registry (Draft v1)

> Danh sách nguồn ingest ban đầu cho CLV ở giai đoạn tiền-code. Mục tiêu của file này là chốt **nguồn nào được theo dõi**, vì sao chọn, mức độ tin cậy, và collector dự kiến.

---

## 1. Nguyên tắc chọn nguồn

CLV ưu tiên nguồn theo thứ tự sau:

1. **Có cấu trúc trúc tiếp** — RSS/Atom hoặc HTML dễ parse.
2. **Tín hiệu cao, ít rác** — ưu tiên nguồn có xác suất xuất hiện deal usable cao.
3. **Phù hợp user ở Việt Nam** — tránh lãng phí quota ingest vào deal chỉ dành cho US/EU nội bộ.
4. **Hợp với self-host và low-maintenance** — không phụ thuộc quá sớm vào API khó xin key hoặc dễ rate-limit.
5. **An toàn pháp lý / ToS hơn social scraping nặng** — giai đoạn đầu ưu tiên RSS/blog/guide trước Reddit/X/Discord automation.

---

## 2. Nhóm nguồn ưu tiên theo phase

### Phase 2–4: nguồn nên làm trước
- RSS / Atom feeds
- Curated blog posts / listicles
- Product / promo pages có cấu trúc ổn định

### Phase 5–7: nguồn mở rộng sau
- Reddit posts / subreddit tracking
- Product Hunt launches
- X/Twitter danh sách account theo dõi công

### Phase 8+ mới cân nhắc
- Discord / Telegram communities
- nguồn cần login hoặc anti-bot nặng
- scraping có xác suất vi phạm ToS cao

---

## 3. Danh sách nguồn khởi đầu

## 3.1. RSS / Deal Discovery — Phase 4

### 1) Hacker News
- **id**: `hackernews-rss`
- **kind**: `rss` · **URL**: `https://news.ycombinator.com/rss`
- **enabled**: true · **priority**: medium · **trustLevel**: medium
- **tags**: dev, ai, saas, launch
- **Giá trị**: tốt cho dev tools, AI tools mới, launch sớm
- **Rủi ro**: nhiều noise, cần scoring tốt

### 2) Product Hunt
- **id**: `producthunt-rss`
- **kind**: `rss` · **URL**: `https://www.producthunt.com/feed`
- **enabled**: true · **priority**: high · **trustLevel**: high
- **tags**: ai, saas, launch
- **Giá trị**: tốt cho AI/SaaS mới có deal launch
- **Rủi ro**: nhiều sản phẩm không có free plan thật sự

### 3) BetaList
- **id**: `betalist-rss`
- **kind**: `rss` · **URL**: `https://betalist.com/feed`
- **enabled**: true · **priority**: medium · **trustLevel**: medium
- **tags**: startup, early-access, saas
- **Giá trị**: có thể phát hiện early-access / credits
- **Rủi ro**: nhiều deal chưa rõ value

### 4) DEV.to — free tools tag
- **id**: `dev-to-rss`
- **kind**: `rss` · **URL**: `https://dev.to/feed/tag/freetools`
- **enabled**: false · **priority**: low · **trustLevel**: medium
- **tags**: dev, tools, freetools
- **Giá trị**: community posts về free tools
- **Rủi ro**: chất lượng không đồng đều

## 3.2. Official Vendor Blogs (RSS) — Phase 4

### 5) GitHub Blog
- **id**: `github-blog-rss`
- **kind**: `rss` · **URL**: `https://github.blog/feed/`
- **enabled**: true · **priority**: high · **trustLevel**: high
- **tags**: dev, credits, official
- **Giá trị**: GitHub Education, Copilot updates, free tiers

### 6) GitHub Education Blog
- **id**: `github-education-blog`
- **kind**: `rss` · **URL**: `https://github.blog/tag/education/feed/`
- **enabled**: true · **priority**: high · **trustLevel**: high
- **tags**: education, devtools, credits, official
- **Giá trị**: GitHub Student Developer Pack updates, free credits for students

### 7) JetBrains Blog
- **id**: `jetbrains-blog-rss`
- **kind**: `rss` · **URL**: `https://blog.jetbrains.com/feed/`
- **enabled**: true · **priority**: medium · **trustLevel**: high
- **tags**: devtools, education, official
- **Giá trị**: JetBrains free licenses, student programs

### 8) AWS News Blog
- **id**: `aws-blog-rss`
- **kind**: `rss` · **URL**: `https://aws.amazon.com/blogs/aws/feed/`
- **enabled**: false · **priority**: medium · **trustLevel**: high
- **tags**: cloud, credits, official
- **Giá trị**: AWS free tier announcements, credit programs

### 9) Vercel Blog
- **id**: `vercel-blog-rss`
- **kind**: `rss` · **URL**: `https://vercel.com/blog/rss.xml`
- **enabled**: false · **priority**: medium · **trustLevel**: high
- **tags**: devtools, cloud, official
- **Giá trị**: Vercel free tier updates, Next.js announcements

### 10) Supabase Blog
- **id**: `supabase-blog-rss`
- **kind**: `rss` · **URL**: `https://supabase.com/blog/rss.xml`
- **enabled**: false · **priority**: medium · **trustLevel**: high
- **tags**: cloud, devtools, official
- **Giá trị**: Supabase free tier, credits, new features

## 3.3. Curated AI Tool Directories (HTML/RSS) — Phase 4

### 11) There's An AI For That
- **id**: `theresanaiforthat-rss`
- **kind**: `rss` · **URL**: `https://theresanaiforthat.com/rss/`
- **enabled**: false · **priority**: high · **trustLevel**: medium
- **tags**: ai, curated, tools
- **Giá trị**: curated AI tool directory — filter cho free/freemium
- **Rủi ro**: cần filter mạnh để phân biệt free thật vs "free trial ngắn"

### 12) FutureTools
- **id**: `futuretools-html`
- **kind**: `html` · **URL**: `https://www.futuretools.io/`
- **enabled**: false · **priority**: high · **trustLevel**: medium
- **tags**: ai, curated, tools
- **Giá trị**: AI tools directory với free tier filter
- **Rủi ro**: cần HTML collector, cấu trúc có thể thay đổi

### 13) SaaSHub — Free Alternatives
- **id**: `saashub-html`
- **kind**: `html` · **URL**: `https://www.saashub.com/free`
- **enabled**: false · **priority**: medium · **trustLevel**: medium
- **tags**: saas, curated, alternatives
- **Giá trị**: tìm free tools và alternative pages
- **Rủi ro**: không phải lúc nào cũng có promo time-bound

## 3.4. Official Vendor Pages (HTML) — Phase 4

### 14) Epic Games Free Games
- **id**: `epicgames-free-html`
- **kind**: `html` · **URL**: `https://store.epicgames.com/en-US/free-games`
- **enabled**: false · **priority**: medium · **trustLevel**: high
- **tags**: gaming, official
- **Ghi chú**: không có RSS — cần HTML collector

## 3.5. Ecommerce / Voucher VN — Phase 4

### 15) MMO4ME — Deals & Vouchers
- **id**: `mmo4me-rss`
- **kind**: `rss` · **URL**: `https://mmo4me.com/forums/-/index.rss`
- **enabled**: false · **priority**: medium · **trustLevel**: medium
- **tags**: voucher, ecommerce, vn
- **Rủi ro**: chất lượng không đồng đều, enable thận trọng

## 3.6. Community Sources — Phase 7+

> Không enable cho tới khi scoring và filtering đã ổn định.

### 16) Reddit — r/SaaS
- **id**: `reddit-saas`
- **kind**: `reddit` · **URL**: `https://www.reddit.com/r/SaaS/.rss`
- **enabled**: false · **priority**: medium · **trustLevel**: medium
- **tags**: community, saas, launch
- **Giá trị**: founder promos và launch deals
- **Rủi ro**: noise cao

### 17) Reddit — r/SideProject
- **id**: `reddit-sideproject`
- **kind**: `reddit` · **URL**: `https://www.reddit.com/r/SideProject/.rss`
- **enabled**: false · **priority**: low · **trustLevel**: medium
- **tags**: community, launch, saas
- **Giá trị**: indie launches kèm promo codes

### 18) Reddit — r/Entrepreneur
- **id**: `reddit-entrepreneur`
- **kind**: `reddit` · **URL**: `https://www.reddit.com/r/Entrepreneur/.rss`
- **enabled**: false · **priority**: low · **trustLevel**: medium
- **tags**: community, saas, deals
- **Giá trị**: occasional deal posts từ founders

### 19) X/Twitter — AI Tool Hunters List
- **id**: `twitter-ai-hunters`
- **kind**: `twitter` · **URL**: TBD (cần Twitter API v2 + list ID)
- **enabled**: false · **priority**: medium · **trustLevel**: low
- **tags**: social, ai, launch
- **Giá trị**: deal signal sớm nhất từ AI founders
- **Rủi ro**: API khó, anti-bot, ToS risk — không auto sớm
---

## 4. `SourceConfig` đề xuất

```ts
export type SourceKind = 'rss' | 'html' | 'official' | 'reddit' | 'twitter' | 'manual';

export interface SourceConfig {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  enabled: boolean;
  priority: 'high' | 'medium' | 'low';
  trustLevel: 'high' | 'medium' | 'low';
  tags: string[];
  notes?: string;
}
```

---

## 5. Danh sách source nên enable ở bản đầu

Để xuất enable trước 6–8 source kiểu low-risk, dễ ingest:

1. Hacker News (RSS)
2. Product Hunt (feed/manual)
3. 2 blog tổng hợp free AI tools đã chọn tay
4. 2 blog tổng hợp SaaS trials đã chọn tay
5. 1–3 official free-plan / credit pages của vendor bạn thường xuyên quan tâm

Mục tiêu không phải có thật nhiều nguồn, mà là có **ít nguồn nhưng chất lượng đủ tốt để test analyzer + scoring**.

---

## 6. Ghi chú vận hành

- Không nên ingest social sources quá sớm.
- Không nên bắt source discovery thành scraping project nặng ngay từ đầu.
- Mỗi source cần có `enabled` flag để disable nhanh khi site đổi cấu trúc hoặc gây noise.
- Nên log `sourceId`, số item lấy được, số item mới, số item bị bỏ qua.
