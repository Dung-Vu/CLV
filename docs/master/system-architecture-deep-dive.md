# System Architecture Deep Dive

> Tài liệu này đi sâu vào chi tiết kiến trúc của CLV: module, dependency, data flow, và các quyết định thiết kế quan trọng.

---

## 1. Tổng quan kiến trúc

- Mô tả lại kiến trúc tổng ở mức high-level.
- Nêu rõ các nguyên tắc thiết kế: layered, modular, agentic, testable.

---

## 2. Module & boundary chi tiết

- Trình bày chi tiết từng module chính:
  - `modules/freebies`
  - `modules/ingestion`
  - `modules/analyzer`
  - `modules/scoring`
  - `modules/policy`
  - `modules/execution`
  - `modules/agents`
- Với mỗi module:
  - Trách nhiệm (responsibility).
  - API public (các hàm service chính).
  - Dependency sang module khác.

---

## 3. Data flow end-to-end

- Mô tả flow từ lúc một freebie được phát hiện đến khi được claim:
  - `SourceConfig` → Collector → Freebie.raw → Analyzer → Scoring/Policy → Dashboard → Execution → ClaimLog.
- Có thể dùng sequence diagram (ASCII hoặc link tới hình) mô tả.

---

## 4. Database schema & quan hệ

- Mô tả các bảng chính (Freebie, UserPrefs, ClaimLog, có thể thêm AgentRunLog).
- Nêu các key/foreign key, index quan trọng.
- Giải thích lý do chọn cấu trúc như vậy (trade-off, normalization vs. flexibility).

---

## 5. Integration với LLM & dịch vụ ngoài

- Mô tả abstraction `LlmClient` và các implementation.
- Mô tả cách hệ thống gọi LLM (timeout, retry, rate limit cơ bản).
- Nêu các integration khác (RSS, HTTP sources, browser automation).

---

## 6. Quyết định thiết kế quan trọng (ADR lite)

- Ghi lại một số quyết định kiến trúc:
  - Vì sao chọn Next.js + Prisma.
  - Vì sao tách scoring/policy khỏi Analyzer.
  - Vì sao dùng executor semi-auto trước khi full auto.
- Với mỗi quyết định: bối cảnh, lựa chọn, lý do, trade-off.

---

## 7. Hướng dẫn dev mới

- Tóm tắt: nếu 1 dev mới join (hoặc bạn quay lại sau vài tháng), nên đọc phần nào trước để hiểu kiến trúc.
