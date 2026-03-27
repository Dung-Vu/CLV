# CLAUDE.md — CLV Project Context for AI Assistants

> Đọc file này trước khi viết bất kỳ dòng code nào cho project CLV.
> File này dành cho AI coding assistants (Claude, Copilot, Cursor, v.v.)

---

## 1. Project overview

CLV là một **AI agent cá nhân, self-hosted** để săn freebies / trials / promos (AI tools, SaaS, cloud credits) cho 1 người dùng ở Việt Nam.

- **Không phải SaaS public** — không cần multi-tenant, không cần auth phức tạp.
- **Human-in-the-loop trước** — không mặc định auto-claim.
- **Self-host** — chạy trên VPS hoặc máy cá nhân.
- Docs chiến lược đầy đủ ở `docs/` — đọc trước khi implement.

---

## 2. Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14+ App Router + TypeScript strict |
| ORM | Prisma + PostgreSQL |
| LLM | OpenAI SDK (abstracted qua `LlmClient` interface) |
| Validation | Zod |
| Testing | Vitest |
| Automation | Playwright (Phase 8+, chưa cần ngay) |
| Scheduling | node-cron hoặc systemd/PM2 external |

---

## 3. Cấu trúc thư mục chuẩn

```
src/
  app/                  # Next.js App Router — pages, layouts, API routes
  lib/
    db.ts               # PrismaClient singleton (duy nhất)
    logger.ts           # Winston hoặc pino logger
    config.ts           # Đọc env vars, validate bằng Zod
    env.ts              # z.object() schema cho env
    llm.ts              # LlmClient interface + OpenAI implementation
  modules/
    freebies/           # CRUD, status lifecycle, query
    ingestion/          # Collector, source runner
    analyzer/           # Prompt builder, LLM call, output validator
    scoring/            # Rule-based scoring, rescore
    policy/             # Tier classification, execution eligibility
    execution/          # Browser automation (Phase 8+)
    agents/             # Orchestration (Phase 9+)
    sources/            # SourceConfig registry
  jobs/                 # Cron entrypoints (ingestion, analyzer batch)
  scripts/              # One-off CLI scripts
  types/                # Shared types, enums
prisma/
  schema.prisma
tests/
  modules/
```

---

## 4. Conventions bắt buộc

### TypeScript
- `strict: true` — không dùng `any`, không cast tùy tiện.
- Export type riêng: `export type { Freebie }` không lẫn với runtime exports.
- Dùng `interface` cho object shapes, `type` cho unions/intersections.

### Error handling
- Trong service/module: `throw new Error('message rõ ràng')` — không throw string.
- Trong job/script entrypoint: wrap bằng try/catch, log error rồi `process.exit(1)`.
- Không bao giờ swallow error bằng empty catch `{}`.

### Logging
- Luôn dùng `logger` từ `lib/logger.ts` — **không dùng `console.log` trong production code**.
- Log format: `logger.info('message', { context object })`.
- Các điểm bắt buộc log: bắt đầu job, kết thúc job, lỗi, số record xử lý.

### Database
- Chỉ import `prisma` từ `lib/db.ts`.
- Không gọi `prisma.*` trực tiếp từ route handlers hay job entrypoints — phải qua `modules/`.
- Không dùng raw SQL trừ khi có lý do rõ ràng và comment giải thích.

### LLM
- Không gọi OpenAI SDK trực tiếp từ module code — phải qua `LlmClient` interface ở `lib/llm.ts`.
- Luôn validate LLM output bằng Zod trước khi dùng.
- Luôn lưu `analysisVersion` khi lưu kết quả analyzer.
- Có retry + backoff khi LLM call thất bại.

### API Routes (Next.js)
- Không chứa business logic trong route handler — chỉ gọi module function.
- Trả về lỗi theo format: `{ error: string, code?: string }`.
- Luôn validate request body bằng Zod.

---

## 5. Env vars chuẩn

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/clv"

# LLM
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"       # model mặc định cho analyzer
OPENAI_MAX_TOKENS=1000

# App
NODE_ENV="development"
LOG_LEVEL="info"                  # debug | info | warn | error
APP_MODE="clean"                  # clean | grey (xem tier-policy.md)

# Feature flags
AUTO_CLAIM_ENABLED="false"        # tắt mặc định
EXECUTION_DRY_RUN="true"         # bật mặc định
```

Validate tất cả env vars khi app khởi động qua `lib/env.ts` với Zod. Nếu thiếu biến bắt buộc → throw ngay, không để app chạy ngầm với config sai.

---

## 6. Testing

- **Framework**: Vitest
- **Scope**: unit test cho `modules/` là ưu tiên, không test UI.
- **Mock Prisma**: dùng `vitest-mock-extended` hoặc manual mock.
- **Mock LLM**: mock `LlmClient` interface, không gọi API thật trong test.
- **File pattern**: `tests/modules/<module-name>/<file>.test.ts`
- **Chạy**: `pnpm test` hoặc `pnpm test:watch`

---

## 7. Tài liệu cần đọc trước khi implement

| Implement gì | Đọc trước |
|---|---|
| Bất kỳ thứ gì | `docs/master/master-overview.md` |
| DB schema / migration | `docs/master/system-architecture-deep-dive.md` |
| Ingestion module | `docs/phases/phase-04-mvp-ingestion.md` + `docs/sources.md` |
| Analyzer module | `docs/phases/phase-05-mvp-analyzer.md` + `docs/prompt-templates/analyzer-v1.md` |
| Scoring / Policy | `docs/phases/phase-07-scoring-policy.md` + `docs/tier-policy.md` |
| Semi-auto execution | `docs/phases/phase-08-semi-auto-execution.md` |
| Agent orchestration | `docs/phases/phase-09-multi-agent.md` |

---

## 8. Những thứ KHÔNG làm

- ❌ Không dùng `any` — dù chỉ "tạm thời".
- ❌ Không gọi LLM từ route handler hay job entrypoint trực tiếp.
- ❌ Không chứa business logic trong `app/` (Next.js layer).
- ❌ Không commit `.env` hay credentials.
- ❌ Không tạo multi-account hoặc identity workaround trong execution.
- ❌ Không auto-claim deal Tier B/C dù user có yêu cầu.
- ❌ Không bỏ qua Zod validation cho LLM output.
- ❌ Không dùng `console.log` trong code production.
