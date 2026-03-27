# CLV — AI-Powered Global Freebies Hunter

> **Personal AI agent giúp bạn tự động săn, phân tích và ưu tiên các chương trình free / trial / promo giá trị cao trên toàn thế giới (ưu tiên AI tools & SaaS), chạy self-host cho 1 người dùng tại Việt Nam.**

---

## 1. CLV là gì?

CLV là một **dự án cá nhân** biến ý tưởng "AI đi săn freebies cho mình" thành một hệ thống agentic hoàn chỉnh:
- Tự động **thu thập** thông tin từ các nguồn như RSS, blog tổng hợp, Reddit, ProductHunt, v.v.
- Dùng LLM để **chuẩn hoá & phân tích** từng deal: giá trị ước tính, hạn dùng, rủi ro, khả năng claim được từ Việt Nam.
- **Chấm điểm & xếp hạng** dựa trên cấu hình của riêng bạn (scoring & policy engine).
- Cung cấp **dashboard** để bạn xem, lọc, đánh dấu claimed/ignored và về sau có thể **semi-auto thực thi** một số deal Tier A an toàn.

**Trạng thái mục tiêu (master project):** CLV chạy 24/7 trên VPS của bạn như một AI agent riêng, mỗi ngày tổng hợp những deal đáng quan tâm nhất, bạn chỉ cần mở dashboard để quyết định có claim hay không.

---

## 2. Ảnh tổng thể kiến trúc

Ở mức high-level, CLV gồm các tầng chính:

- **Ingestion (Collectors)** – đọc `SOURCES` config, kéo dữ liệu từ RSS, blog, API, social.
- **Analyzer (LLM)** – chuẩn hoá từng freebie thành JSON structured (value, expiry, risk, eligible_vn, category, score gốc…).
- **Scoring & Policy** – áp dụng rule của bạn để tính `score` 0–100 và quyết định Tier (A/B/C) + action recommendation.
- **Dashboard** – UI Next.js để xem & thao tác với freebies, tạo vòng lặp feedback (ClaimLog, note…).
- **Execution (Semi-auto)** – dùng browser automation cho một số deal Tier A (an toàn, không cần card/KYC).
- **Agents** – Supervisor/Research/Execution agents điều phối các pipeline trên theo lịch/sự kiện.

Chi tiết từng layer và data flow end-to-end được mô tả kỹ hơn trong:
- `docs/long-term-strategy.md`
- `docs/master/system-architecture-deep-dive.md`

---

## 3. Các chức năng chính

- **Freebies Intelligence**  
  Thu thập & phân tích deal từ nhiều nguồn (AI tools, SaaS, cloud credits, v.v.), gắn nhãn và xếp hạng theo cấu hình cá nhân.

- **Personal Scoring Engine**  
  Cho phép bạn định nghĩa mức độ ưu tiên: value tối thiểu, loại deal ưa thích (ai-tool/saas/cloud/khác), mức risk chấp nhận được.

- **Dashboard cho 1 người dùng**  
  Giao diện để xem danh sách freebies, lọc theo score/status/category, xem chi tiết, và đánh dấu claimed/ignored/pinned.

- **Semi-auto Execution (Tier A)**  
  Hỗ trợ chạy tự động một số thao tác lặp lại (điền form đơn giản) trên các deal an toàn, nhưng vẫn giữ bạn là người quyết định cuối.

- **Multi-agent Orchestration**  
  Tách vai trò thành nhiều agent (Supervisor, Research, Execution) để dễ mở rộng, tuning và theo dõi hành vi hệ thống.

---

## 4. Roadmap triển khai (10 Phase)

Dự án được chia thành 10 phase rõ ràng, mỗi phase có file riêng trong `docs/phases/`:

1. **Phase 1 – Tầm nhìn & Phạm vi**  
   Chuẩn hoá tech stack, cấu trúc repo, tooling, env.

2. **Phase 2 – Nghiên cứu nguồn freebies**  
   Tạo `docs/sources.md` và `src/config/sources.ts` – bản đồ nguồn dữ liệu.

3. **Phase 3 – Kiến trúc & schema dữ liệu**  
   Thiết kế module layout và `schema.prisma` (Freebie, UserPrefs, ClaimLog).

4. **Phase 4 – MVP Ingestion**  
   Implement collectors đầu tiên, chạy `ingest:once` để đổ dữ liệu `raw` vào DB.

5. **Phase 5 – MVP Analyzer (LLM)**  
   Dùng LLM để chuẩn hoá & phân tích freebies, chuyển từ `raw` sang `analyzed`.

6. **Phase 6 – Dashboard & Feedback loop**  
   Xây UI Next.js để xem, lọc, update trạng thái và log feedback.

7. **Phase 7 – Scoring & Policy Engine**  
   Tính `score`, quyết định Tier & action recommendation bằng config riêng.

8. **Phase 8 – Semi-auto Execution (Tier A)**  
   Thêm executor với browser automation cho deal an toàn.

9. **Phase 9 – Multi-agent CLV**  
   Định nghĩa các agent, runner, và scheduling cơ bản.

10. **Phase 10 – Mở rộng & tối ưu dài hạn**  
    Thêm vertical mới (food/ecommerce), tối ưu hiệu năng, logging, metrics.

Chi tiết từng phase: xem thư mục `docs/phases/`.

---

## 5. Tài liệu "master" khi dự án hoàn thiện

Khi CLV tiến gần tới trạng thái ổn định, các tài liệu trong `docs/master/` sẽ mô tả dự án như một "master project":

- `master-overview.md` – tóm tắt mục tiêu, chức năng, kiến trúc.
- `system-architecture-deep-dive.md` – phân tích chi tiết kiến trúc & data flow.
- `agent-design-and-workflows.md` – mô tả đầy đủ agent & workflow.
- `operations-runbook.md` – hướng dẫn vận hành, deploy, xử lý sự cố.
- `security-privacy-compliance.md` – nguyên tắc bảo mật & riêng tư.
- `extension-experiment-playbook.md` – cách mở rộng & chạy experiments.

---

## 6. Tech stack (dự kiến)

- **Frontend / Backend**: Next.js 15 (App Router, TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **AI Layer**: Groq/OpenAI (ban đầu), có thể chuyển sang Ollama/local về sau
- **Ingestion & Automation**: Node-cron, RSS/HTTP fetchers, Puppeteer/Playwright
- **Auth & Session**: iron-session (nếu cần login basic cho dashboard)
- **Deploy**: Self-hosted VPS (PM2 + Nginx)

Chi tiết implementation sẽ dần được bổ sung khi các phase được triển khai.

---

## 7. Trạng thái & lưu ý

- Đây là **dự án cá nhân** phục vụ chính bạn, không phải sản phẩm thương mại.
- Mọi hành động auto/semi-auto phải tôn trọng ToS của nền tảng bên ngoài – bạn chịu trách nhiệm về cách sử dụng.
- Repo hiện tập trung vào **chiến lược & kiến trúc**; phần code sẽ được triển khai dần theo 10 phase.

---

*Built with ❤️ in Ho Chi Minh City, Vietnam*
