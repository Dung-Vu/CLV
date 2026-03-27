# Phase 1 — Tầm nhìn & Phạm vi CLV

> Mục tiêu: chốt phạm vi kỹ thuật và chuẩn bị nền tảng code để các phase sau chỉ việc build feature, không phải dọn repo lại.

---

## 1. Mục tiêu kỹ thuật của Phase 1

- Xác định **stack & constraints** cho toàn project (Next.js, DB, LLM, hạ tầng).
- Chuẩn hoá **structure repo** và tooling (TypeScript, lint, format, scripts).
- Định nghĩa rõ **non-functional requirements**: self-host, chi phí gần 0, ưu tiên private.
- Không cần viết business logic, nhưng sau phase này, repo phải ở trạng thái:
  - Clone về là `npm install && npm run lint && npm run test` chạy OK (dù test còn rất ít).
  - Có thể bootstrap Next.js app trống nếu bạn muốn bắt đầu sớm.

---

## 2. Quyết định về tech stack

### 2.1. Ứng dụng & Backend

- **Next.js 15 (App Router) + TypeScript**.
- API routes dùng cho:
  - Trigger manual ingest.
  - Xem dữ liệu freebies.

### 2.2. Database & ORM

- **PostgreSQL** (self-host hoặc managed tuỳ bạn).
- **Prisma ORM** để mapping schema (đã mô tả trong `long-term-strategy.md`).

### 2.3. AI Layer

- Giai đoạn đầu:
  - Dùng **LLM cloud** (Groq / OpenAI) free/low-cost để iterate nhanh.
- Về sau:
  - Optional: chuyển sang **Ollama/local** để tự chủ.

### 2.4. Hạ tầng & Deploy

- Self-host trên VPS bạn đã có.
- Sử dụng **PM2 + Nginx** cho runtime và reverse proxy.

---

## 3. Công việc triển khai code trong Phase 1

### 3.1. Khởi tạo project & tooling

1. Tạo skeleton Next.js (tuỳ bạn có muốn làm ở Phase 1 hay dời sang Phase 3):
   - `npx create-next-app@latest clv-app --ts --app` (hoặc init trực tiếp trong repo này).
2. Thiết lập các file config chung:
   - `.editorconfig`
   - `.prettierrc`
   - `.eslintrc.*`
   - `.gitignore` (thêm `.env`, `node_modules`, log…).
3. Thêm npm scripts cơ bản vào `package.json`:
   - `lint`, `format`, `test`, `dev`, `build`.

### 3.2. Chuẩn bị môi trường runtime

- Định nghĩa biến môi trường cần thiết (chưa cần giá trị thật):
  - `DATABASE_URL`
  - `OPENAI_API_KEY` hoặc `GROQ_API_KEY`
  - (Về sau) keys cho Twitter/Reddit nếu dùng API.
- Tạo file `.env.example` để tự động hoá việc setup.

### 3.3. Folder structure ban đầu

Đề xuất cấu trúc (sẽ refine dần ở Phase 3):

```text
src/
  app/           # Next.js routes & pages
  lib/           # helper chung (logging, config loader, etc.)
  modules/       # sẽ chứa logic domain (freebie, ingestion, analyzer)
  tests/         # test cơ bản
prisma/
  schema.prisma  # sẽ được define ở Phase 3
```

### 3.4. Thiết lập CI nhẹ (optional nhưng nên làm)

- Nếu bạn dùng GitHub Actions:
  - Workflow chạy `npm install`, `npm run lint`, `npm run test` trên mỗi PR.
- Mục tiêu: giữ repo sạch ngay từ đầu.

---

## 4. Tiêu chí hoàn thành Phase 1

Phase 1 được coi là xong khi:

- [ ] Tech stack & constraint được ghi rõ trong README/chiến lược.
- [ ] Repo có cấu trúc thư mục rõ ràng, config lint/format cơ bản.
- [ ] Có `.env.example` mô tả các biến cốt lõi.
- [ ] Có thể chạy được ít nhất 2 lệnh mà không lỗi: `npm run lint`, `npm run test` (dù test chỉ là placeholder).

Sau Phase 1, bạn sẵn sàng bước sang Phase 2 để khoanh vùng nguồn dữ liệu và bắt đầu nghĩ về cấu hình cho collectors.