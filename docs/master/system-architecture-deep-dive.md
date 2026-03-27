# System Architecture Deep Dive

> Tài liệu mô tả kiến trúc kỹ thuật mục tiêu của CLV theo góc nhìn **triển khai code**, trong bối cảnh hiện tại repo vẫn đang ở giai đoạn thiết kế và chưa build application code.

---

## 1. Tổng quan kiến trúc

CLV được thiết kế như một hệ thống **layered + modular + agent-friendly** để tránh việc logic ingestion, LLM, scoring và execution bị trộn lẫn vào nhau.

### Nguyên tắc thiết kế

1. **Layered architecture** — tách rõ ingestion, analyzer, scoring, policy, execution.
2. **Module boundary rõ ràng** — mỗi domain có repository/service/types riêng.
3. **Human-in-the-loop mặc định** — execution chỉ là downstream capability, không phải lõi mặc định.
4. **Self-host first** — thiết kế phù hợp 1 người dùng cá nhân, chạy trên VPS hoặc home server.
5. **Observability first** — mọi bước phải log được input, output, error và trạng thái.

### Cấu trúc codebase đề xuất

```text
src/
  app/            # Next.js App Router (UI + API routes)
  lib/
    db.ts         # PrismaClient singleton
    logger.ts
    config.ts
    env.ts
  modules/
    freebies/
    ingestion/
    analyzer/
    scoring/
    policy/
    execution/
    agents/
    sources/
  jobs/           # scheduled jobs / cron entrypoints
  scripts/        # one-off CLI scripts
  tests/
prisma/
  schema.prisma
```

---

## 2. Module & boundary chi tiết

### `modules/freebies`
**Trách nhiệm**: domain trung tâm — CRUD, query dashboard, status lifecycle của freebie.

**Public API gợi ý**
- `createRawFreebie(input)`
- `findPendingRaw(limit)`
- `listDashboardFreebies(filters)`
- `markClaimed(freebieId, payload)`
- `markIgnored(freebieId, reason)`
- `updateAnalysis(freebieId, analysis)`

**Dependency**: `lib/db`, type mappers. Không phụ thuộc `execution` hay `agents`.

### `modules/ingestion`
**Trách nhiệm**: đọc `SourceConfig`, chọn collector phù hợp, fetch item thô, chuẩn hoá mức đầu vào.

**Public API gợi ý**
- `runIngestionOnce()`
- `runSourceIngestion(sourceId)`

**Dependency**: `modules/sources`, `modules/freebies`, `lib/logger`. Không phụ thuộc `analyzer`.

### `modules/analyzer`
**Trách nhiệm**: gọi LLM, build prompt, validate JSON output, map kết quả về schema domain.

**Public API gợi ý**
- `analyzeFreebieOnce(freebieId)`
- `analyzePendingFreebies(limit)`
- `buildAnalyzerPrompt(input)`

**Dependency**: `modules/freebies`, `lib/config`, `lib/logger`. Dùng abstraction `LlmClient` thay vì gọi SDK provider thẳng.

### `modules/scoring`
**Trách nhiệm**: chấm điểm định lượng từ dữ liệu đã phân tích. Tách khỏi Analyzer để có thể rescore mà không gọi lại LLM.

**Public API gợi ý**
- `scoreFreebie(freebie, prefs)`
- `rescorePendingFreebies()`
- `explainScoreBreakdown(freebie)`

### `modules/policy`
**Trách nhiệm**: xác định deal thuộc Tier nào, có được hiển thị mạnh hay semi-auto candidate không.

**Public API gợi ý**
- `classifyTier(freebie)`
- `evaluateExecutionPolicy(freebie, prefs)`
- `isAutoCandidate(freebie, prefs)`

### `modules/execution`
**Trách nhiệm**: browser automation mức low-risk; lưu evidence và claim outcome.

**Public API gợi ý**
- `prepareExecutionPlan(freebieId)`
- `executeClaimPlan(plan)`
- `storeExecutionEvidence(result)`

**Guardrail**: không xử lý card/payment trong flow mặc định; có panic switch và dry-run mode.

### `modules/agents`
**Trách nhiệm**: orchestration ở phase sau. Không chứa toàn bộ business logic lõi.

**Public API gợi ý**
- `runSupervisorAgent()`
- `runResearchAgent()`
- `runExecutionAgent()`

### `modules/sources`
**Trách nhiệm**: quản lý `SourceConfig`, source registry, enable/disable, metadata độ tin cậy.

**Public API gợi ý**
- `listEnabledSources()`
- `getSourceById(id)`

---

## 3. Data flow end-to-end

```text
[1] Trigger ingestion (scheduler hoặc manual)
[2] Ingestion đọc danh sách source enabled
[3] Collector fetch + map → RawItem[]
[4] Freebie.upsert với status = 'raw'
[5] Analyzer đọc freebies raw chưa xử lý
[6] LLM trả về JSON structured
[7] Validate (Zod) + lưu vào Freebie
[8] Scoring tính điểm lại từ dữ liệu đã chuẩn hoá
[9] Policy phân loại tier và execution eligibility
[10] Dashboard hiển thị top deals → user review
[11] Nếu đủ điều kiện: Execution xử lý semi-auto
[12] ClaimLog lưu kết quả, bằng chứng, lỗi và thời điểm
```

### Điểm tách rời quan trọng
- Ingestion không biết LLM dùng provider nào.
- Analyzer không quyết định auto-claim.
- Policy không thực thi browser action.
- Agents chỉ orchestration, không chứa toàn bộ business logic.

---

## 4. Database schema & quan hệ

### Bảng lõi (cần có ngay từ Phase 3)

#### `Freebie`
```prisma
model Freebie {
  id              String    @id @default(cuid())
  title           String
  source          String
  url             String
  description     String?
  status          String    @default("raw")  // raw | analyzed | claimed | ignored | expired | analysis_error
  category        String    @default("unknown")
  valueUsd        Float?
  expiry          DateTime?
  eligibleVn      Boolean   @default(false)
  riskLevel       String    @default("unknown")
  score           Float     @default(0)
  tier            String?   // A | B | C
  summaryVi       String?
  stepsJson       String?   // JSON array string
  cardRequired    Boolean   @default(false)
  kycRequired     Boolean   @default(false)
  frictionLevel   String    @default("unknown")
  analysisVersion String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  claimLogs       ClaimLog[]
}
```

#### `UserPrefs`
```prisma
model UserPrefs {
  id                    String   @id @default(cuid())
  minValueUsd           Float    @default(20)
  allowedCategories     String[] @default([])
  blockedCategories     String[] @default([])
  maxRiskLevel          String   @default("medium")
  autoClaimEnabled      Boolean  @default(false)
  autoClaimMinScore     Float    @default(80)
  allowedExecutionTiers String[] @default(["A"])
  mode                  String   @default("clean")  // clean | grey
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### `ClaimLog`
```prisma
model ClaimLog {
  id            String   @id @default(cuid())
  freebieId     String
  freebie       Freebie  @relation(fields: [freebieId], references: [id])
  status        String   // success | failed | manual | auto
  mode          String   // manual | semi-auto | auto
  executionType String?
  message       String?
  evidencePath  String?
  startedAt     DateTime?
  finishedAt    DateTime?
  createdAt     DateTime @default(now())
}
```

### Bảng nên thêm sớm

#### `SourceConfig`
```prisma
model SourceConfig {
  id                    String   @id @default(cuid())
  name                  String
  kind                  String   // rss | html | official | reddit | twitter | manual
  url                   String
  enabled               Boolean  @default(true)
  priority              String   @default("medium")
  trustLevel            String   @default("medium")
  fetchIntervalMinutes  Int      @default(60)
  tags                  String[] @default([])
  notes                 String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

#### `AgentRunLog`
```prisma
model AgentRunLog {
  id          String   @id @default(cuid())
  agentName   String
  runType     String
  status      String   // success | failed | partial
  startedAt   DateTime
  finishedAt  DateTime?
  summary     String?
  error       String?
  createdAt   DateTime @default(now())
}
```

### Index quan trọng
- `Freebie(url)` — tránh trùng lặp khi ingest
- `Freebie(status, createdAt)` — batch processing
- `Freebie(score DESC, createdAt DESC)` — dashboard
- `ClaimLog(freebieId, createdAt DESC)`
- `SourceConfig(enabled, kind)`

---

## 5. Integration với LLM & dịch vụ ngoài

### LLM abstraction

```ts
export interface LlmClient {
  analyze(prompt: string): Promise<string>; // trả về raw JSON string
}
```

Business logic chỉ gọi `LlmClient`, không gọi SDK provider trực tiếp trong service layer.

### Guardrails khi gọi LLM
- timeout per request
- retry với backoff
- validate JSON bằng Zod
- lưu `analysisVersion` để biết record nào sinh từ prompt nào
- giới hạn token/prompt length kiểm soát chi phí

### Tích hợp khác
- RSS/Atom feeds qua thư viện `rss-parser`
- HTTP fetch cho curated pages
- Browser automation qua Playwright (Phase 8+)
- Cron/systemd/PM2 cho scheduling

---

## 6. Quyết định thiết kế quan trọng (ADR lite)

### ADR 01 — Chọn Next.js + TypeScript
**Bối cảnh**: cần dashboard, API routes nhẹ, khả năng mở rộng dần.
**Lựa chọn**: Next.js App Router + TypeScript.
**Lý do**: 1 codebase cho UI + route handlers; phù hợp self-host; ecosystem tốt cho dashboard nội bộ.
**Trade-off**: cần tách jobs/scripts rõ ràng để tránh app layer làm quá nhiều việc.

### ADR 02 — Chọn PostgreSQL + Prisma
**Bối cảnh**: dữ liệu có quan hệ rõ: Freebie, ClaimLog, UserPrefs, SourceConfig.
**Lựa chọn**: PostgreSQL + Prisma.
**Lý do**: query tốt cho dashboard, migration rõ, phù hợp self-host dài hạn.
**Trade-off**: setup nặng hơn SQLite ở giai đoạn cực sớm.

### ADR 03 — Tách Analyzer khỏi Scoring/Policy
**Bối cảnh**: nếu LLM vừa phân tích vừa quyết định toàn bộ score/policy, hệ thống khó debug và khó kiểm soát.
**Lựa chọn**: Analyzer trả structured facts; score và policy do rule/function riêng.
**Lý do**: dễ rescore khi đổi sở thích; dễ audit vì sao deal được đẩy lên cao; giảm lock-in vào 1 prompt cụ thể.
**Trade-off**: thêm layer trung gian nhưng kiểm soát tốt hơn.

### ADR 04 — Semi-auto trước full auto
**Bối cảnh**: freebie automation có nhiều rủi ro ToS, account, payment, anti-bot.
**Lựa chọn**: xây semi-auto execution trước; full auto chỉ là bước rất muộn và có điều kiện.
**Lý do**: giảm nguy cơ incident lớn ở giai đoạn đầu; phù hợp bản chất cá nhân, risk-aware của CLV.

---

## 7. Hướng dẫn dev mới

Nếu quay lại repo sau vài tháng, nên đọc theo thứ tự:

1. `docs/long-term-strategy.md`
2. `docs/master/master-overview.md`
3. `docs/sources.md`
4. `docs/tier-policy.md`
5. `docs/prompt-templates/analyzer-v1.md`
6. `docs/phases/phase-01-vision-scope.md`
7. `docs/phases/phase-03-architecture-schema.md`
8. `docs/phases/phase-04-mvp-ingestion.md`
9. `docs/phases/phase-05-mvp-analyzer.md`

Chiến lược rõ trước, code sau — không cần nghĩ lại từ đầu.
