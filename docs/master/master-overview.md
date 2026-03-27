# CLV Master Overview

> Tài liệu tổng hợp bức tranh toàn cảnh của CLV ở trạng thái triển khai mục tiêu, đồng thời phản ánh **trạng thái hiện tại** của repo: đang ở giai đoạn viết chiến lược và blueprint triển khai code, chưa bắt đầu xây application.

---

## 1. Mục tiêu & use case chính

CLV là một **AI agent cá nhân, self-host**, được thiết kế để săn, phân tích, ưu tiên và hỗ trợ claim các freebies / trials / promos có giá trị cho **1 người dùng cá nhân ở Việt Nam**.

Dự án này **không phải SaaS public**. Mọi quyết định kiến trúc, bảo mật và vận hành đều ưu tiên:

- dùng riêng cho một người hoặc một nhóm rất nhỏ
- chạy trên hạ tầng riêng (VPS / home server)
- giảm tối đa việc lộ dữ liệu cá nhân, session và lịch sử claim
- ưu tiên chế độ **advisor / semi-auto** trước khi nghĩ đến full automation

### Use case điển hình

1. **Săn free AI tools / SaaS trials** — phát hiện deal cho AI writing, coding, search, image, video tools; CLV đọc nguồn, chuẩn hoá, chấm điểm, đề xuất deal đáng thử.
2. **Theo dõi cloud credits / dev credits** — free credits cho VPS, GPU, API, startup/student programs; phân biệt deal usable với deal marketing rỗng.
3. **Lọc deal phù hợp với người dùng ở Việt Nam** — nhận diện ràng buộc region lock, card required, KYC, phone verification.
4. **Hỗ trợ claim theo mức độ an toàn** — giai đoạn đầu gợi ý thủ công, giai đoạn sau semi-auto với deal Tier A.
5. **Ghi nhớ lịch sử claim và hành vi sử dụng** — lưu lịch sử claim, deal bỏ qua, deal hết hạn để cá nhân hoá scoring về sau.

### Giới hạn dự án

- Không bảo đảm claim thành công 100%.
- Không hướng tới multi-tenant SaaS.
- Không mặc định auto-claim các deal cần thẻ, KYC, hoặc có nguy cơ vi phạm ToS.
- Không xem VPN spoof, multi-account, identity workaround là flow mặc định.

---

## 2. Chức năng mục tiêu theo phase

### Ingestion (Phase 4)
- **Input**: danh sách `SourceConfig` từ RSS, curated article, blog, cộng đồng.
- **Process**: collector đọc nguồn, map về item thô.
- **Output**: record `Freebie` mới trong DB với trạng thái `raw`.

### Analyzer (Phase 5)
- **Input**: `Freebie` trạng thái `raw`.
- **Process**: LLM đọc title, description, source, URL → trả về JSON structured.
- **Output**: cập nhật `valueUsd`, `eligibleVn`, `riskLevel`, `summaryVi`, `steps`.

### Dashboard & Feedback (Phase 6)
- **Input**: deal đã ingest/analyze.
- **Process**: hiển thị bảng, filter, sort, review, đánh dấu claimed/ignored.
- **Output**: vòng phản hồi để cải thiện policy.

### Scoring & Policy (Phase 7)
- **Input**: dữ liệu phân tích + user preferences + rule set.
- **Process**: tách scoring định lượng khỏi phân tích ngôn ngữ của LLM.
- **Output**: điểm ưu tiên, tier rủi ro, quyết định show / suggest mạnh / semi-auto candidate.

### Semi-auto Execution (Phase 8)
- **Input**: deal đủ điều kiện theo policy.
- **Process**: browser automation thực hiện các bước low-risk (mở link, điền form cơ bản, log/screenshot).
- **Output**: `ClaimLog` và bằng chứng thực thi.

### Multi-agent orchestration (Phase 9)
- **Input**: metric hệ thống, lịch sử claim, source performance.
- **Process**: supervisor và các agent chuyên trách phối hợp ingest, review, scoring refinement.
- **Output**: đề xuất cải thiện vòng lặp vận hành.

---

## 3. Kiến trúc cấp cao

```text
Sources
  ↓
Ingestion
  ↓
Normalization / Raw Storage
  ↓
Analyzer (LLM)
  ↓
Scoring + Policy
  ↓
Dashboard / Human Review
  ↓
Semi-auto Execution
  ↓
ClaimLog / Memory / Analytics
```

### Các layer chính

- **UI layer**: Next.js App Router — dashboard, detail page, admin actions.
- **API / orchestration layer**: route handlers, scripts, cron entrypoints, tác vụ nền.
- **Domain modules**: ingestion, analyzer, scoring, policy, execution, agents.
- **Storage layer**: PostgreSQL + Prisma cho dữ liệu giao dịch và cấu hình cá nhân.
- **Observability layer**: logging, run logs, screenshots, error trails.

### Nguyên tắc xuyên suốt

- Self-host và tính riêng tư là ưu tiên hàng đầu.
- Human-in-the-loop trước, autonomy sau.
- Tách Analyzer khỏi Scoring/Policy để dễ kiểm soát và debug.
- Mọi bước có rủi ro phải log được và có thể disable nhanh.

---

## 4. Hướng dẫn đọc bộ docs

### Tài liệu chiến lược nền
- `docs/long-term-strategy.md` — chiến lược dài hạn, nguyên tắc thiết kế, roadmap tổng.

### Tài liệu theo phase
- `docs/phases/phase-01` → `phase-10` — lộ trình build từ ingestion đến multi-agent và tối ưu dài hạn.

### Tài liệu master
- `docs/master/system-architecture-deep-dive.md` — chi tiết module, boundary, data flow, DB schema.
- `docs/master/agent-design-and-workflows.md` — vai trò agent và workflow phối hợp.
- `docs/master/operations-runbook.md` — vận hành, deploy, debug, rollback.
- `docs/master/security-privacy-compliance.md` — bảo mật, riêng tư, guardrails và risk modes.
- `docs/master/extension-experiment-playbook.md` — guideline thử nghiệm và mở rộng.

### Tài liệu policy / prompt / source
- `docs/sources.md` — danh sách nguồn ingest ban đầu và tiêu chí chọn nguồn.
- `docs/tier-policy.md` — định nghĩa Tier A/B/C và mode Clean/Grey.
- `docs/prompt-templates/analyzer-v1.md` — prompt chuẩn v1 cho Analyzer.

---

## 5. Trạng thái triển khai hiện tại

- **Version logic**: `v0.1-docs`
- **Trạng thái thực tế**: đang viết chiến lược triển khai code, **chưa bắt đầu xây application code**.
- **Docs theo phase**: đã có khung tốt cho tất cả 10 phase.
- **Master docs**: đang được điền dần (file này là một phần của quá trình đó).
- **Codebase**: chưa khởi tạo.

### Quy ước làm việc: nên chốt trước khi viết code

1. `docs/sources.md` — danh sách nguồn ingest cụ thể
2. `docs/tier-policy.md` — Tier A/B/C canonical
3. `docs/prompt-templates/analyzer-v1.md` — prompt Analyzer versioned
4. `docs/master/system-architecture-deep-dive.md` — module boundaries và DB schema
