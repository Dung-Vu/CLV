# Context7 Prompt Templates — CLV

> Bộ prompt mẫu dùng với **Context7 MCP** trong VSCode.
> Context7 sẽ tự động pull docs chính xác của thư viện (Next.js, Prisma, Zod, Vitest…) vào context trước khi AI viết code.
>
> Cách dùng: copy prompt bên dưới → paste vào Copilot Chat / Claude / Cursor cùng với file liên quan đang mở.

---

## 1. Khởi tạo project (Phase 3)

### 1a. Tạo `prisma/schema.prisma`

```
use context7

Tạo file prisma/schema.prisma cho dự án CLV theo đúng các model sau:
- Freebie (trường: id, title, source, url, description, status, category, valueUsd, expiry, eligibleVn, riskLevel, score, tier, summaryVi, stepsJson, cardRequired, kycRequired, frictionLevel, analysisVersion, createdAt, updatedAt, claimLogs)
- ClaimLog (trường: id, freebieId, status, mode, executionType, message, evidencePath, startedAt, finishedAt, createdAt)
- SourceConfig (trường: id, name, kind, url, enabled, priority, trustLevel, fetchIntervalMinutes, tags, notes, createdAt, updatedAt)
- UserPrefs (trường: id, minValueUsd, allowedCategories, blockedCategories, maxRiskLevel, autoClaimEnabled, autoClaimMinScore, allowedExecutionTiers, mode, createdAt, updatedAt)
- AgentRunLog (trường: id, agentName, runType, status, startedAt, finishedAt, summary, error, createdAt)

Yêu cầu:
- PostgreSQL provider
- Thêm index: Freebie(url), Freebie(status, createdAt), Freebie(score DESC), ClaimLog(freebieId), SourceConfig(enabled, kind)
- Sử dụng đúng kiểu dữ liệu Prisma (String, Float, Boolean, DateTime, String[])
- Enum-style fields dùng String với comment rõ các giá trị hợp lệ
```

### 1b. Tạo `src/lib/env.ts`

```
use context7

Tạo file src/lib/env.ts cho CLV dùng Zod để validate tất cả env vars khi app khởi động.

Các biến bắt buộc:
- DATABASE_URL (string url)
- OPENAI_API_KEY (string)
- OPENAI_MODEL (string, default: "gpt-4o-mini")
- OPENAI_MAX_TOKENS (number, default: 1000)
- NODE_ENV (enum: development | production | test)
- LOG_LEVEL (enum: debug | info | warn | error, default: info)
- APP_MODE (enum: clean | grey, default: clean)
- AUTO_CLAIM_ENABLED (boolean string, default: false)
- EXECUTION_DRY_RUN (boolean string, default: true)

Yêu cầu:
- Throw rõ ràng khi thiếu biến bắt buộc
- Export `env` object đã parse để dùng trong toàn app
- Không import trực tiếp `process.env` ở chỗ khác, chỉ dùng qua `env`
```

### 1c. Tạo `src/lib/llm.ts`

```
use context7

Tạo file src/lib/llm.ts cho CLV.

Yêu cầu:
- Định nghĩa interface LlmClient: { analyze(prompt: string): Promise<string> }
- Implement OpenAiLlmClient implement LlmClient dùng openai SDK
- Có retry và exponential backoff (tối đa 3 lần)
- Có timeout per request
- Log mỗi lần call và mỗi lần retry
- Export singleton `llmClient` dùng OpenAiLlmClient với config từ `src/lib/env.ts`
- TypeScript strict, không dùng any
```

---

## 2. Ingestion module (Phase 4)

### 2a. Tạo collector cho RSS source

```
use context7

Tạo file src/modules/ingestion/collectors/rss-collector.ts cho CLV.

Nhiệm vụ: đọc RSS/Atom feed từ URL, trả về mảng RawItem[].

RawItem interface:
- title: string
- url: string
- description: string
- source: string
- publishedAt: Date | null

Yêu cầu:
- Dùng thư viện `rss-parser`
- Xử lý lỗi fetch gracefully (không throw khi 1 source lỗi)
- Log số item lấy được từ mỗi source
- Dedupe theo url trong batch (không insert duplicate trong 1 lần chạy)
- TypeScript strict
```

### 2b. Tạo ingestion runner

```
use context7

Tạo file src/modules/ingestion/runner.ts cho CLV.

Nhiệm vụ: lấy danh sách source enabled, chạy collector tương ứng, upsert Freebie vào DB.

Yêu cầu:
- Hàm `runIngestionOnce(): Promise<{ ingested: number; skipped: number; errors: number }>`
- Upsert Freebie theo url (không duplicate)
- Freebie mới tạo có status = 'raw'
- Log bắt đầu, kết thúc, số liệu
- Không import prisma trực tiếp — gọi qua `modules/freebies`
- TypeScript strict
```

---

## 3. Analyzer module (Phase 5)

### 3a. Tạo prompt builder

```
use context7

Tạo file src/modules/analyzer/prompt-builder.ts cho CLV.

Nhiệm vụ: build analyzer prompt từ Freebie record, theo đúng template ở docs/prompt-templates/analyzer-v1.md.

Yêu cầu:
- Hàm `buildAnalyzerPrompt(input: { title: string; source: string; url: string; description: string }): string`
- Interpolate các biến vào template rõ ràng
- Export ANALYZER_VERSION = 'analyzer-v1' để lưu vào analysisVersion
- TypeScript strict
```

### 3b. Tạo output validator (Zod)

```
use context7

Tạo file src/modules/analyzer/output-schema.ts cho CLV.

Dùng Zod để validate JSON output từ LLM theo schema AnalyzerOutput:
- value_usd: number | null
- expiry: string (YYYY-MM-DD format) | null
- eligible_vn: boolean
- risk_level: enum low | medium | high | unknown
- category: enum ai-tool | saas | cloud | voucher | other
- score: number (0-100)
- summary_vi: string
- steps: string[]
- card_required: boolean
- kyc_required: boolean
- friction_level: enum low | medium | high | unknown
- tier_hint: enum A | B | C

Yêu cầu:
- Export `AnalyzerOutputSchema` (Zod schema)
- Export `AnalyzerOutput` type (inferred từ schema)
- Export hàm `parseAnalyzerOutput(raw: string): AnalyzerOutput` — parse JSON rồi validate, throw nếu sai
```

### 3c. Tạo analyzer service

```
use context7

Tạo file src/modules/analyzer/service.ts cho CLV.

Nhiệm vụ: lấy Freebie raw, gọi LLM, validate output, lưu kết quả.

Yêu cầu:
- Hàm `analyzeFreebieOnce(freebieId: string): Promise<void>`
- Hàm `analyzePendingFreebies(limit: number): Promise<{ success: number; failed: number }>`
- Gọi qua `LlmClient`, không gọi OpenAI trực tiếp
- Validate output bằng Zod schema
- Lưu kết quả vào Freebie qua `modules/freebies`
- Cập nhật status: 'analyzed' khi thành công, 'analysis_error' khi lỗi
- Lưu `analysisVersion` vào record
- Log rõ từng bước
- TypeScript strict
```

---

## 4. Scoring & Policy (Phase 7)

### 4a. Tạo scoring engine

```
use context7

Tạo file src/modules/scoring/engine.ts cho CLV.

Nhiệm vụ: chấm điểm deal theo rule-based, tách hoàn toàn khỏi LLM.

Input: Freebie record đã analyzed + UserPrefs
Output: { score: number; breakdown: Record<string, number>; explanation: string[] }

Các tiêu chí chấm điểm gợi ý:
- eligible_vn = true: +20
- risk_level low: +20, medium: +5, high: -20
- card_required = false: +15
- kyc_required = false: +10
- friction_level low: +10, medium: +0, high: -10
- value_usd > 50: +15, 20-50: +10, 0-20: +5
- expiry còn > 7 ngày: +5

Yêu cầu:
- Score tối đa 100, tối thiểu 0
- Export `scoreFreebie(freebie, prefs)` và `explainScoreBreakdown(freebie, prefs)`
- TypeScript strict, không dùng any
```

### 4b. Tạo policy classifier

```
use context7

Tạo file src/modules/policy/classifier.ts cho CLV theo đúng định nghĩa Tier ở docs/tier-policy.md.

Yêu cầu:
- Hàm `classifyTier(freebie: Freebie, prefs: UserPrefs): 'A' | 'B' | 'C'`
  - Tier A: eligible_vn=true, risk_level=low, card_required=false hoặc verify-only, friction low|medium
  - Tier B: có bất kỳ điều kiện: card_required=true, kyc_required=true, friction=high, risk_level=medium
  - Tier C: risk_level=high, eligible_vn=false, score<30, hoặc thiếu thông tin quan trọng
- Hàm `evaluateExecutionPolicy(freebie, prefs): 'allow' | 'suggest' | 'block'`
  - allow: Tier A + AUTO_CLAIM_ENABLED=true + prefs.autoClaimEnabled
  - suggest: Tier A nhưng chưa bật auto, hoặc Tier B
  - block: Tier C hoặc bất kỳ guardrail bị vi phạm
- Hàm `isAutoCandidate(freebie, prefs): boolean`
- TypeScript strict
```

---

## 5. Dashboard API route (Phase 6)

```
use context7

Tạo file src/app/api/freebies/route.ts cho CLV dùng Next.js App Router.

GET /api/freebies:
- Query params: status, tier, category, minScore, page, pageSize
- Validate params bằng Zod
- Gọi `modules/freebies` để query, không gọi prisma trực tiếp
- Trả về: { data: Freebie[], total: number, page: number, pageSize: number }

PATCH /api/freebies/[id]:
- Body: { status?: string; tier?: string; note?: string }
- Validate body bằng Zod
- Chỉ cho phép update status thành: claimed | ignored
- Gọi `modules/freebies.markClaimed` hoặc `markIgnored`

Yêu cầu:
- Không chứa business logic trong route
- Lỗi trả về { error: string, code?: string }
- TypeScript strict
```

---

## 6. Testing

### 6a. Test analyzer service

```
use context7

Tạo file tests/modules/analyzer/service.test.ts cho CLV dùng Vitest.

Test cases cần có:
1. analyzeFreebieOnce: gọi LlmClient và lưu kết quả khi thành công
2. analyzeFreebieOnce: cập nhật status = 'analysis_error' khi LLM lỗi
3. analyzeFreebieOnce: throw khi Zod validation fail
4. analyzePendingFreebies: trả về đúng { success, failed } count

Yêu cầu:
- Mock `LlmClient` interface, không gọi API thật
- Mock `modules/freebies` functions
- Dùng `vi.fn()` và `vi.mocked()`
- TypeScript strict
```

### 6b. Test policy classifier

```
use context7

Tạo file tests/modules/policy/classifier.test.ts cho CLV dùng Vitest.

Test cases cần có:
1. classifyTier: Freebie eligible_vn=true, risk=low, card=false → Tier A
2. classifyTier: Freebie có card_required=true → Tier B
3. classifyTier: Freebie risk=high → Tier C
4. classifyTier: Freebie eligible_vn=false → Tier C
5. evaluateExecutionPolicy: Tier A + autoClaimEnabled=true → allow
6. evaluateExecutionPolicy: Tier A + autoClaimEnabled=false → suggest
7. evaluateExecutionPolicy: Tier C → block
```

---

## 7. Jobs / Cron entrypoints

### 7a. Ingestion job

```
use context7

Tạo file src/jobs/ingest.ts cho CLV.

Nhiệm vụ: entrypoint chạy ingestion một lần, dùng cho cron hoặc chạy tay.

Yêu cầu:
- Import và validate env qua `lib/env.ts` trước tiên
- Gọi `runIngestionOnce()` từ `modules/ingestion`
- Log rõ kết quả: số ingested, skipped, errors
- Wrap toàn bộ bằng try/catch, `process.exit(1)` khi lỗi
- TypeScript strict
```

### 7b. Analyzer batch job

```
use context7

Tạo file src/jobs/analyze.ts cho CLV.

Nhiệm vụ: entrypoint chạy analyzer batch, xử lý tất cả freebie có status='raw'.

Yêu cầu:
- Import và validate env qua `lib/env.ts` trước tiên
- Đọc ANALYZER_BATCH_SIZE từ env (default: 10)
- Gọi `analyzePendingFreebies(limit)` từ `modules/analyzer`
- Log kết quả chi tiết
- Wrap bằng try/catch, `process.exit(1)` khi lỗi
- TypeScript strict
```

---

## 8. Tips dùng Context7 hiệu quả

- Luôn bắt đầu prompt bằng `use context7` — Context7 sẽ tự detect thư viện cần pull docs.
- Nếu muốn chỉ định rõ thư viện: thêm `resolve library-id with context7` trước prompt chính.
- Kết hợp với **mở đúng file** liên quan trong VSCode trước khi chat — AI sẽ có thêm context thực tế từ các import và types đang có.
- Sau khi AI generate xong, kiểm tra 3 điểm: import paths đúng chưa, có `any` không, có gọi thẳng `prisma` ngoài `lib/db.ts` không.
