# Phase 2 — Nghiên cứu nguồn freebies toàn cầu

> Mục tiêu: chuyển phần "research nguồn" thành **artefact kỹ thuật** phục vụ code: một file cấu hình nguồn (sources config) + tài liệu `docs/sources.md` làm input trực tiếp cho Ingestion ở Phase 4.

---

## 1. Mục tiêu kỹ thuật của Phase 2

- Xác định **danh sách nguồn cụ thể** sẽ ingest (URL, loại, tần suất, priority).
- Thiết kế **cấu trúc config** để collectors dùng lại, không hard-code từng nguồn trong code.
- Tạo **type/interface** cho `Source` trong codebase để đảm bảo type-safety.
- Sau phase này, việc thêm/bớt nguồn chỉ cần sửa config, không đụng logic ingest.

---

## 2. Phân loại nguồn dữ liệu

### 2.1. Nhóm 1 — Bài tổng hợp / curated

- Ví dụ: "Best Free AI Tools 2026", "Free Perplexity Pro methods", "Student/academic free AI tools".
- Đặc điểm:
  - Ít, nhưng chất lượng cao.
  - Có thể crawl định kỳ theo tuần/tháng.

### 2.2. Nhóm 2 — RSS / Freebies feeds

- Các feed tổng hợp freebie, deals, giveaway, đặc biệt cho software/SaaS.
- Có thể lấy từ các catalog "Top freebies RSS feeds".
- Ưu tiên feed có category liên quan digital/software.

### 2.3. Nhóm 3 — Social / Real-time (để Phase sau)

- Twitter/X: search stream cho các từ khoá.
- Reddit: r/Freebies, r/deals, ProductHunt.
- Discord/Telegram: channel săn sale/free.

Phase 2 tập trung **định nghĩa và chọn nguồn**, chưa cần code kết nối social stream phức tạp.

---

## 3. Artefacts cần tạo trong Phase 2

### 3.1. Tài liệu `docs/sources.md`

- Nội dung đề xuất:
  - Bảng liệt kê từng nguồn:
    - Tên site/feed.
    - URL.
    - Loại (curated_article, rss_feed, subreddit, v.v.).
    - Tần suất cập nhật đề xuất.
    - Ghi chú (ví dụ: chỉ AI tools, có nhiều spam, ưu tiên thấp…).
  - Ghi chú về region/eligibility nếu biết trước (VD: site chuyên US-only).

### 3.2. File cấu hình nguồn trong code

Ví dụ: `src/config/sources.ts` (hoặc `.json` nếu muốn thuần data):

```ts
export type SourceType =
  | 'curated_article'
  | 'rss_feed'
  | 'reddit'
  | 'product_hunt'
  | 'other';

export interface SourceConfig {
  id: string;           // unique, ví dụ: 'datacamp-free-ai-2026'
  type: SourceType;
  url: string;
  enabled: boolean;
  tags: string[];       // ['ai-tools', 'saas', 'high-value']
  priority: number;     // 1 (cao) - 5 (thấp)
  fetchIntervalMin: number; // số phút giữa các lần fetch khuyến nghị
}

export const SOURCES: SourceConfig[] = [
  // fill từ docs/sources.md
];
```

Phase 2 không cần implement fetch, chỉ cần type và cấu trúc này.

---

## 4. Công việc triển khai code trong Phase 2

### 4.1. Xây dựng `docs/sources.md`

- Dựa trên research đã làm, điền vào bảng ít nhất:
  - 5–10 bài viết curated.
  - 5–10 RSS feeds.
- Đảm bảo mỗi nguồn có `id` đề xuất (slug), để reuse trong code.

### 4.2. Tạo module config nguồn

- Tạo thư mục `src/config/` (nếu chưa có).
- Tạo file `sources.ts` với:
  - Khai báo `SourceType`, `SourceConfig`.
  - Export mảng `SOURCES` trống hoặc với vài entry mẫu.
- Optional: thêm `zod` schema cho `SourceConfig` để validate.

### 4.3. Hook sơ bộ với future collectors

- Tạo interface tối thiểu cho collector, ví dụ trong `src/modules/ingestion/types.ts`:

```ts
export interface Collector {
  id: string; // nên trùng với hoặc liên quan SourceConfig.id
  supports(source: SourceConfig): boolean;
  ingest(source: SourceConfig): Promise<void>;
}
```

- Chưa cần implement collector, nhưng design sẵn interface để Phase 4 chỉ cần implement theo.

---

## 5. Tiêu chí hoàn thành Phase 2

Phase 2 được coi là xong khi:

- [ ] `docs/sources.md` tồn tại, liệt kê tối thiểu ~10–20 nguồn tiềm năng, có id/type/url rõ ràng.
- [ ] `src/config/sources.ts` (hoặc tương đương) tồn tại với:
  - Định nghĩa `SourceType`, `SourceConfig`.
  - Export `SOURCES` (có thể mới là placeholder).
- [ ] Có interface collector cơ bản để phase 4 sử dụng.
- [ ] Thêm ít nhất 1–2 test nhỏ validate `SOURCES` (ví dụ: id không trùng, url hợp lệ dạng string, v.v.).

Sau Phase 2, bạn đã có **bản đồ nguồn dữ liệu** + **cấu trúc config** sẵn, giúp Phase 4 (MVP Ingestion) chỉ việc đọc `SOURCES` và map từng nguồn sang collector tương ứng, không cần nghĩ lại từ đầu.