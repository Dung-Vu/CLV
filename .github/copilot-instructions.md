# GitHub Copilot Instructions — CLV

CLV là một **AI agent cá nhân, self-hosted** để săn freebies / trials / promos cho 1 người dùng ở Việt Nam. Không phải SaaS public.

## Stack

Next.js 14 App Router · TypeScript strict · Prisma + PostgreSQL · Zod · Vitest · OpenAI SDK (abstracted)

## Cấu trúc module

- Business logic → `src/modules/<domain>/`
- DB access → chỉ qua `src/lib/db.ts` (PrismaClient singleton)
- LLM call → chỉ qua `src/lib/llm.ts` (`LlmClient` interface)
- External integrations → `src/lib/integrations/`
- Route handler → chỉ gọi module function, không chứa logic
- Logger → `src/lib/logger.ts`, không dùng `console.log`

## Module boundaries

- `src/modules/scoring/engine.ts` = pure scoring rules
- `src/modules/scoring/scoring.service.ts` = adapter/service entrypoints dùng lại engine
- `src/modules/scoring/scoring.batch.ts` = batch runner/orchestration

## Conventions

- Không dùng `any`
- Validate LLM output bằng Zod trước khi lưu
- Validate env vars khi khởi động qua `src/lib/env.ts`
- Error: throw `new Error('rõ message')`, không swallow
- Logging bắt buộc: bắt đầu job, kết thúc job, số record, lỗi
- Test: Vitest, mock `LlmClient` và Prisma, không test UI

## Domain models chính

- `Freebie` — record deal, có `status`: raw → analyzed → claimed/ignored/expired
- `ClaimLog` — lịch sử claim của một freebie
- `SourceConfig` — nguồn ingest (RSS, HTML, official...)
- `UserPrefs` — cài đặt người dùng, bao gồm `mode: clean | grey`

## Tier & Policy

- Tier A: low-risk, eligible VN, không cần thẻ → candidate semi-auto
- Tier B: có cảnh báo → hiển thị nhưng không auto
- Tier C: high-risk / low-confidence → ẩn mặc định
- `AUTO_CLAIM_ENABLED=false` và `EXECUTION_DRY_RUN=true` là default

## Docs cần đọc

- Kiến trúc: `docs/master/system-architecture-deep-dive.md`
- Nguồn: `docs/sources.md`
- Tier: `docs/tier-policy.md`
- Prompt: `docs/prompt-templates/analyzer-v1.md`
- Chi tiết quy ước: `CLAUDE.md`
