# Phase 4 — MVP Ingestion (Collectors)

> Mục tiêu: xây dựng phiên bản tối giản nhưng chạy được của tầng Ingestion – đọc `SOURCES` config, chạy 1–2 collectors thật, insert được dữ liệu thô vào bảng `Freebie` với trạng thái `raw`.

---

## 1. Mục tiêu kỹ thuật của Phase 4

- Implement **collector interface** đã phác ở Phase 2.
- Viết ít nhất **1–2 collectors cụ thể** (ví dụ: RSS feed collector, simple HTML page scraper cho article curated).
- Xây dựng **ingestion orchestrator** để:
  - Lặp qua `SOURCES`.
  - Chọn collector phù hợp.
  - Ghi log kết quả ingest.
- Có cách để **chạy ingestion thủ công** (script hoặc API route) cho debug.

---

## 2. Thiết kế collector layer

### 2.1. Interface collector (nhắc lại & refine)

Trong `src/modules/ingestion/ingestion.types.ts`:

```ts
import type { SourceConfig } from '@/config/sources';

export interface Collector {
  id: string; // ví dụ: 'rss-collector', 'curated-article-collector'

  supports(source: SourceConfig): boolean;

  ingest(source: SourceConfig): Promise<void>;
}
```

Có thể tạo thêm type cho kết quả ingest thô (nếu cần):

```ts
export interface RawItem {
  title: string;
  url: string;
  description?: string;
  sourceId: string;
}
```

### 2.2. Implement collectors đầu tiên

Ví dụ cấu trúc:

```text
src/modules/ingestion/
  ingestion.types.ts
  ingestion.service.ts
  collectors/
    rss.collector.ts
    curated-article.collector.ts
```

- `rss.collector.ts`:
  - Dùng thư viện RSS parser để đọc feed URL.
  - Map các item thành `RawItem`.
- `curated-article.collector.ts` (optional cho phase 4):
  - Fetch HTML page, dùng regex/simple parsing để lấy danh sách links.

---

## 3. Ingestion service & orchestrator

Trong `src/modules/ingestion/ingestion.service.ts`:

- Khởi tạo danh sách collectors:

```ts
const collectors: Collector[] = [
  rssCollector,
  curatedArticleCollector,
];
```

- Hàm chính:

```ts
export async function runIngestionOnce() {
  for (const source of SOURCES.filter(s => s.enabled)) {
    const collector = collectors.find(c => c.supports(source));
    if (!collector) {
      // log: no collector for this source
      continue;
    }
    try {
      await collector.ingest(source);
    } catch (e) {
      // log error với source.id
    }
  }
}
```

- Bên trong `collector.ingest`, sau khi có `RawItem[]`, map vào model `Freebie`:
  - Kiểm tra trùng (ví dụ: theo `url` + `title`).
  - Nếu mới, insert `status = 'raw'`.

---

## 4. Giao diện chạy Ingestion

### 4.1. Script CLI đơn giản

- Tạo file `scripts/run-ingestion.ts` (hoặc dùng `ts-node`/`tsx`):

```ts
import { runIngestionOnce } from '@/modules/ingestion/ingestion.service';

runIngestionOnce().then(() => {
  // eslint-disable-next-line no-console
  console.log('Ingestion finished');
  process.exit(0);
});
```

- Thêm script trong `package.json`:
  - `"ingest:once": "tsx scripts/run-ingestion.ts"`

### 4.2. API route (optional)

- Tạo route `POST /api/admin/ingest` chỉ cho bạn gọi (có auth đơn giản) để trigger ingestion từ browser/Postman.

---

## 5. Chi tiết triển khai collectors đầu tiên

### 5.1. RSS Collector

- Sử dụng 1 thư viện RSS client phổ biến (ví dụ: `rss-parser`).
- Logic cơ bản:
  1. Parse feed url từ `source.url`.
  2. Với mỗi item:
     - Lấy `title`, `link`, `contentSnippet`/`content`.
     - Map vào `RawItem`.
  3. Gọi repository của `Freebie` để upsert.

- Đảm bảo:
  - Có logging cho số item đọc được, số item mới, số item bỏ qua.

### 5.2. Curated Article Collector (nếu làm ở phase này)

- Mục tiêu tối giản: chỉ cần lấy danh sách link trong một bài viết mà bạn đã biết cấu trúc.
- Về lâu dài có thể nâng cấp HTML parsing, nhưng Phase 4 chỉ cần chạy được cho 1–2 site.

---

## 6. Tiêu chí hoàn thành Phase 4

Phase 4 được coi là xong khi:

- [ ] Tồn tại module `ingestion` với interface `Collector` rõ ràng.
- [ ] Có ít nhất 1 collector hoạt động (RSS) – chạy `npm run ingest:once` và thấy row mới trong `Freebie` với `status = 'raw'`.
- [ ] Ingestion service xử lý được nhiều `SourceConfig`, log được lỗi nhưng không crash toàn bộ.
- [ ] Có ít nhất 1–2 test (hoặc test thủ công) chứng minh collector xử lý thành công 1 feed thật.

Sau Phase 4, bạn đã có **dòng dữ liệu chảy vào DB**, dù mới ở dạng thô. Phase 5 sẽ dùng LLM Analyzer để chuẩn hoá các `Freebie` này thành thông tin đầy đủ (value, risk, score, v.v.).
