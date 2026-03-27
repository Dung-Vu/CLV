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

## 3. Danh sách nguồn khởi đầu để xuyết

## 3.1. RSS / Freebie / Deal discovery

### 1) Hacker News
- **Loại**: community / launch / discovery
- **Collector dự kiến**: RSS hoặc API wrapper
- **Giá trị**: tốt cho dev tools, AI tools mới, launch sớm
- **Rủi ro**: nhiều noise, cần scoring tốt
- **Ưu tiên**: Medium

### 2) Product Hunt
- **Loại**: launch discovery
- **Collector dự kiến**: feed/API/manual curated
- **Giá trị**: tốt cho AI/SaaS mới có deal launch
- **Rủi ro**: nhiều sản phẩm không có free plan thật sự
- **Ưu tiên**: High

### 3) SaaSHub / alternative listing pages
- **Loại**: curated directory
- **Collector dự kiến**: HTML curated page collector
- **Giá trị**: tìm free tools và alternative pages
- **Rủi ro**: không phải lúc nào cũng có promo time-bound
- **Ưu tiên**: Medium

### 4) BetaList
- **Loại**: startup launch discovery
- **Collector dự kiến**: RSS/HTML nếu phù hợp
- **Giá trị**: có thể phát hiện early-access / credits
- **Rủi ro**: nhiều deal chưa rõ value
- **Ưu tiên**: Medium

## 3.2. Curated article / review / guide sources

### 5) FutureTools / AI tool directories
- **Loại**: curated AI tools
- **Collector dự kiến**: article/list collector
- **Giá trị**: hữu ích cho use case AI tools
- **Rủi ro**: cần filter mạnh để phân biệt free thật vs “free trial ngắn”
- **Ưu tiên**: High

### 6) Blog tổng hợp “best free AI tools”
- **Loại**: curated articles
- **Collector dự kiến**: manual curated list + article parser đơn giản
- **Giá trị**: tốt cho discovery giai đoạn đầu
- **Rủi ro**: bài cũ dễ stale
- **Ưu tiên**: High

### 7) Blog tổng hợp “best SaaS free trials”
- **Loại**: curated articles
- **Collector dự kiến**: manual curated list
- **Giá trị**: hỗ trợ map market nhanh
- **Rủi ro**: nhiều bài SEO spam, cần chọn tay kỹ
- **Ưu tiên**: High

## 3.3. Official vendor / promo sources

### 8) Official pricing / free plan pages của vendor lớn
- **Loại**: official source
- **Collector dự kiến**: targeted HTML collector
- **Giá trị**: dữ liệu đáng tin cậy nhất về free plan
- **Rủi ro**: không phải lúc nào cũng có promo đặc biệt
- **Ưu tiên**: High

### 9) Official startup / student / nonprofit credit pages
- **Loại**: official program pages
- **Collector dự kiến**: targeted source config
- **Giá trị**: tốt cho cloud credits và dev credits
- **Rủi ro**: eligibility phức tạp
- **Ưu tiên**: High

## 3.4. Community sources (mở rộng sau)

### 10) Reddit — r/SaaS, r/SideProject, r/Entrepreneur
- **Loại**: community launch / founder promo
- **Collector dự kiến**: Reddit API/manual later
- **Giá trị**: có thể có promo code hoặc early-access
- **Rủi ro**: noise cao
- **Ưu tiên**: Low–Medium

### 11) X/Twitter list của founder / AI tool hunters
- **Loại**: social
- **Collector dự kiến**: manual curation, không auto sớm
- **Giá trị**: deal xuất hiện rất sớm
- **Rủi ro**: API khó, anti-bot, ToS risk cao hơn
- **Ưu tiên**: Low ở giai đoạn đầu

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
