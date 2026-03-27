# CLV — Phase Tracker

> Trạng thái triển khai từng phase. Cập nhật file này sau mỗi lần hoàn thành một phase.

---

## Tổng quan

| Phase | Tên                          | Trạng thái | Ngày       |
| ----- | ---------------------------- | ---------- | ---------- |
| 1     | Tầm nhìn & Phạm vi           | ✅ Done    | 2026-03-28 |
| 2     | Nghiên cứu nguồn freebies    | ✅ Done    | 2026-03-28 |
| 3     | Kiến trúc & Schema dữ liệu   | ✅ Done    | 2026-03-28 |
| 4     | MVP Ingestion                | ✅ Done    | 2026-03-28 |
| 5     | MVP Analyzer (LLM)           | ✅ Done    | 2026-03-28 |
| 6     | Dashboard & Feedback loop    | ✅ Done    | 2026-03-28 |
| 7     | Scoring & Policy Engine      | ✅ Done    | 2026-03-28 |
| 8     | Semi-auto Execution (Tier A) | ✅ Done    | 2026-03-28 |
| 9     | Multi-agent Orchestration    | ✅ Done    | 2026-03-28 |
| 10    | Mở rộng & Tối ưu             | ✅ Done    | 2026-03-28 |

---

## Chi tiết từng phase

### ✅ Phase 1 — Tầm nhìn & Phạm vi

- [x] Tech stack chốt: Next.js 15, TypeScript strict, Prisma, Zod, Vitest
- [x] `package.json`, `tsconfig.json`, `next.config.ts`
- [x] `.env`, `.env.example`, `.gitignore`, `.editorconfig`, `.prettierrc`
- [x] Cấu trúc thư mục `src/` theo đúng convention
- [x] npm scripts: `dev`, `build`, `test`, `lint`, `ingest:once`, `analyzer:once`

### ✅ Phase 2 — Nghiên cứu nguồn freebies

- [x] `docs/sources.md` — danh sách nguồn + tiêu chí chọn nguồn
- [x] `src/modules/sources/sources.config.ts` — SOURCES registry (6 sources ban đầu)
- [x] `src/modules/sources/sources.service.ts` — `listEnabledSources`, `getSourceById`

### ✅ Phase 3 — Kiến trúc & Schema dữ liệu

- [x] `prisma/schema.prisma` — models: Freebie, UserPrefs, ClaimLog, SourceConfig
- [x] `src/lib/db.ts` — PrismaClient singleton
- [x] `src/lib/env.ts` — Zod env validation
- [x] `src/lib/logger.ts` — Winston logger
- [x] `src/lib/llm.ts` — LlmClient interface + OpenAI-compatible implementation
- [x] `src/lib/config.ts` — app config
- [x] `src/types/index.ts` — shared types & enums
- [x] DB tạo thành công (PostgreSQL local, `npx prisma db push`)

### ✅ Phase 4 — MVP Ingestion

- [x] `src/modules/ingestion/ingestion.types.ts` — Collector interface, RawItem, IngestionResult
- [x] `src/modules/ingestion/collectors/rss.collector.ts` — RSS collector dùng rss-parser
- [x] `src/modules/ingestion/ingestion.service.ts` — `runIngestionOnce()` orchestrator
- [x] `src/jobs/ingestion.job.ts` — entrypoint `npm run ingest:once`
- [x] `src/app/api/ingest/route.ts` — `POST /api/ingest` để trigger thủ công

### ✅ Phase 5 — MVP Analyzer (LLM)

- [x] `src/modules/analyzer/analyzer.types.ts` — AnalyzerInput, AnalyzerOutput, Zod schema
- [x] `src/modules/analyzer/analyzer.prompt.ts` — prompt builder theo template analyzer-v1
- [x] `src/modules/analyzer/analyzer.service.ts` — `analyzeFreebieOnce`, `analyzePendingFreebies`, retry + backoff
- [x] `src/jobs/analyzer.job.ts` — entrypoint `npm run analyzer:once`
- [x] `src/app/api/analyze/route.ts` — `POST /api/analyze` để trigger thủ công
- [x] `tests/modules/analyzer/analyzer.service.test.ts` — 2 test cases (mock LLM)

### ✅ Phase 6 — Dashboard & Feedback loop

- [x] Tailwind CSS v4 — `postcss.config.mjs`, `globals.css` cập nhật
- [x] `src/modules/claimlogs/claimlogs.service.ts` — `createClaimLog`, `getClaimLogsForFreebie`
- [x] `freebies.service.ts` — `markClaimed` / `markIgnored` tự động ghi ClaimLog
- [x] `src/app/dashboard/layout.tsx` — shared nav (Ingest / Analyze trigger buttons)
- [x] `src/app/dashboard/page.tsx` — stats overview (count per status) + quick links
- [x] `src/app/dashboard/freebies/_components/FreebieFilters.tsx` — client filter bar (search, status, tier, category, minScore)
- [x] `src/app/dashboard/freebies/page.tsx` — list table (server component, pagination 25/page)
- [x] `src/app/dashboard/freebies/[id]/page.tsx` — detail page (summary, meta, steps, claim log history)
- [x] `src/app/dashboard/freebies/[id]/_components/FreebieActions.tsx` — Mark Claimed / Ignored buttons (client component)

### ✅ Phase 7 — Scoring & Policy Engine

- [x] `src/modules/scoring/scoring.types.ts` — ScoringContext, ScoringResult
- [x] `src/modules/scoring/scoring.service.ts` — `computeScore()` rule-based (0–100)
- [x] `src/modules/policy/policy.types.ts` — PolicyInput, PolicyResult
- [x] `src/modules/policy/policy.service.ts` — `classifyTier()`, `evaluateExecutionPolicy()`
- [x] `tests/modules/policy/policy.service.test.ts` — 8 test cases
- [x] `tests/modules/scoring/scoring.service.test.ts` — 6 test cases

### ✅ Phase 8 — Semi-auto Execution (Tier A)

- [x] `playwright` installed + Chromium browser downloaded
- [x] `src/modules/execution/execution.types.ts` — `ExecutionMode`, `ExecutionContext`, `ExecutionResult`, `FreebieForExecution`
- [x] `src/modules/execution/drivers/playwright.driver.ts` — `runSignupFlow()`: navigate → fill email → fill password → click submit → detect success
- [x] `src/modules/execution/execution.service.ts` — `getAutoCandidates()`, `executeFreebie()` with policy gate + dry_run guardrail + ClaimLog write
- [x] `freebies.repository.ts` — `findAutoCandidates()` coarse DB query
- [x] `src/lib/env.ts` + `.env` — added `CLAIM_EMAIL` optional env var
- [x] `src/app/api/freebies/[id]/execute/route.ts` — `POST /api/freebies/[id]/execute` (mode: dry_run | semi_auto)
- [x] `src/app/dashboard/freebies/[id]/_components/ExecuteButton.tsx` — UI with Dry Run / Semi-auto buttons + step log panel
- [x] `src/scripts/run-execution.ts` — interactive CLI: list candidates, confirm per deal, run
- [x] `package.json` — `execution:dry` and `execution:run` scripts
- [x] `tests/modules/execution/execution.service.test.ts` — 6 tests (policy gate, dry_run result, ClaimLog write)

### ✅ Phase 9 — Multi-agent Orchestration

- [x] `src/modules/agents/agent.types.ts` — `Agent` interface, `AgentContext`, `AgentResult`
- [x] `src/modules/scoring/scoring.batch.ts` — `rescoreAnalyzedFreebies(limit)` batch re-scorer
- [x] `src/modules/agents/supervisor.agent.ts` — reads DB stats, estimates claimable value, log recommendations
- [x] `src/modules/agents/research.agent.ts` — static analysis of SOURCES registry: disabled sources, coverage gaps
- [x] `src/modules/agents/execution.agent.ts` — orchestrates ingest → analyze → rescore → report candidates
- [x] `src/modules/agents/agent.runner.ts` — `runAllAgents()` sequential runner with per-agent error isolation
- [x] `src/scripts/run-agents.ts` — CLI entrypoint with formatted output
- [x] `package.json` — `agents:run` script
- [x] `tests/modules/agents/agents.test.ts` — 7 tests (supervisor, research, execution, runner)

### ✅ Phase 10 — Mở rộng & Tối ưu

- [x] `src/types/index.ts` — `DealCategory` mở rộng: gaming, education, devtools, food, ecommerce
- [x] `src/modules/analyzer/analyzer.types.ts` — cập nhật `analyzerOutputSchema.category` enum khớp với DealCategory
- [x] `src/modules/scoring/scoring.service.ts` — thay if-else category bằng `CATEGORY_WEIGHTS` config object
- [x] `src/modules/sources/sources.config.ts` — thêm 4 nguồn mới: jetbrains-blog-rss, github-education-blog, epicgames-free-rss, mmo4me-rss
- [x] `prisma/schema.prisma` — thêm 4 index mới (category, eligibleVn, status+score, status+tier)
- [x] `prisma/schema.prisma` — thêm model `AgentRunLog` (id, agentName, actions, runAt)
- [x] `npx prisma db push` — DB sync thành công
- [x] `src/modules/agents/agent.runner.ts` — persist `AgentRunLog` sau mỗi agent run
- [x] `src/app/api/metrics/route.ts` — `GET /api/metrics`: byStatus, byCategory, claimStats, recentAgentRuns, estimatedClaimableValue
- [x] `src/lib/env.ts` + `.env` + `.env.example` — thêm `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (optional)
- [x] `src/lib/telegram.ts` — `sendTelegramAlert()`, `sendPipelineAlert()` (silent skip nếu chưa config)
- [x] `src/modules/agents/supervisor.agent.ts` — trigger Telegram alert khi errors > 5 hoặc rawBacklog > 50
- [x] Tests: 29/29 passing, build: 11 routes, 0 errors

---

## Next step ngay bây giờ

```
Tất cả 10 phases đã hoàn thành ✅
Chạy: pnpm dev để khởi động dashboard
```
