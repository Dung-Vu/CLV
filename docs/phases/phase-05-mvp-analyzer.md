# Phase 5 — MVP Analyzer (LLM chuẩn hoá deal)

> Mục tiêu: xây dựng pipeline LLM tối giản nhưng ổn định để chuyển `Freebie` từ trạng thái `raw` thành record đã được chuẩn hoá với các field như `valueUsd`, `expiry`, `riskLevel`, `eligibleVn`, `score`, `summaryVi`, `steps`.

---

## 1. Mục tiêu kỹ thuật của Phase 5

- Xây dựng **Analyzer service** đọc các `Freebie` `status = 'raw'`.
- Gọi LLM (cloud hoặc local) với **prompt cố định** để nhận về JSON structured.
- Validate JSON (dùng Zod hoặc tương đương) và ghi lại vào DB.
- Thiết kế để sau dễ switch model (OpenAI → Groq → Ollama) mà không đụng logic domain.

---

## 2. Thiết kế layer Analyzer

### 2.1. Cấu trúc module

```text
src/modules/analyzer/
  analyzer.types.ts
  analyzer.prompt.ts
  analyzer.service.ts
  analyzer.client.ts   # wrapper LLM provider
```

### 2.2. Kiểu dữ liệu Analyzer

Trong `analyzer.types.ts`:

```ts
export interface AnalyzerInput {
  id: string;        // Freebie id
  title: string;
  description?: string;
  source: string;
  url: string;
}

export interface AnalyzerOutput {
  valueUsd: number | null;
  expiry: string | null;       // ISO date string or null
  eligibleVn: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  category: string;            // 'ai-tool' | 'saas' | 'cloud' | 'other' | ...
  score: number;               // 0-100
  summaryVi: string;
  steps: string[];
}
```

Có thể thêm Zod schema để validate `AnalyzerOutput` trước khi ghi DB.

---

## 3. Prompt template & LLM client

### 3.1. Prompt template

Trong `analyzer.prompt.ts`, define hàm build prompt, dựa trên khung trong `long-term-strategy.md`:

```ts
export function buildAnalyzerPrompt(input: AnalyzerInput): string {
  return `Analyze this promotion and return ONLY valid JSON:

Title: ${input.title}
Source: ${input.source}
URL: ${input.url}
Description: ${input.description ?? 'N/A'}

Fields:
- value_usd: numeric estimated USD value (null if unknown)
- expiry: ISO date (YYYY-MM-DD) or null
- eligible_vn: true/false if user in Vietnam can realistically claim it
- risk_level: one of ["low","medium","high","unknown"]
- category: short slug like "ai-tool","saas","cloud","other"
- score: 0-100, higher = better for user
- summary_vi: short explanation in Vietnamese
- steps: array of short Vietnamese steps to claim

Return JSON like:
{
  "value_usd": 50,
  "expiry": "2026-03-31",
  "eligible_vn": true,
  "risk_level": "low",
  "category": "ai-tool",
  "score": 85,
  "summary_vi": "...",
  "steps": ["..."]
}`;
}
```

### 3.2. LLM client abstraction

Trong `analyzer.client.ts`:

- Tạo interface trừu tượng:

```ts
export interface LlmClient {
  analyze(prompt: string): Promise<string>; // trả về raw JSON string
}
```

- Implement 1 client cụ thể (ví dụ: OpenAI, Groq) tuỳ vào env:
  - `OpenAiLlmClient`
  - `GroqLlmClient`

- Chọn client dựa trên biến môi trường (ví dụ: `ANALYZER_PROVIDER=openai|groq|local`).

---

## 4. Analyzer service

Trong `analyzer.service.ts`:

- Hàm core:

```ts
export async function analyzeFreebieOnce(freebieId: string) {
  const freebie = await freebieRepository.findById(freebieId);
  if (!freebie) return;

  const input: AnalyzerInput = {
    id: freebie.id,
    title: freebie.title,
    description: freebie.description ?? undefined,
    source: freebie.source,
    url: freebie.url,
  };

  const prompt = buildAnalyzerPrompt(input);
  const raw = await llmClient.analyze(prompt);

  const parsed = parseAndValidate(raw); // dùng Zod hoặc try/catch JSON.parse

  await freebieRepository.updateAnalysis(freebie.id, parsed);
}
```

- Hàm batch:

```ts
export async function analyzePendingFreebies(limit = 10) {
  const freebies = await freebieRepository.findPendingRaw(limit);
  for (const f of freebies) {
    try {
      await analyzeFreebieOnce(f.id);
    } catch (e) {
      // log lỗi, có thể update status = 'raw_error'
    }
  }
}
```

- `updateAnalysis` trong repository sẽ map `AnalyzerOutput` vào các field tương ứng (`valueUsd`, `expiry`, `eligibleVn`, `riskLevel`, `score`, `status = 'analyzed'`, `category`, `summary`, `steps` nếu có field text/string lưu). Nếu chưa có field cho `summaryVi`/`steps`, có thể lưu vào cột text JSON hoặc tạo bảng phụ.

---

## 5. Cách chạy & debug Analyzer

### 5.1. Script CLI

- Tạo script `scripts/run-analyzer.ts`:

```ts
import { analyzePendingFreebies } from '@/modules/analyzer/analyzer.service';

analyzePendingFreebies(10).then(() => {
  console.log('Analyzer run finished');
  process.exit(0);
});
```

- Thêm vào `package.json`:
  - `"analyzer:once": "tsx scripts/run-analyzer.ts"`

### 5.2. API route (optional)

- Route `POST /api/admin/analyzer` để trigger analyze từ UI/admin.

---

## 6. Testing & guardrails

- Test nhỏ cho `buildAnalyzerPrompt` (không chứa ký tự phá JSON,…).
- Test `parseAndValidate` với vài response mẫu (valid/invalid).
- Giới hạn độ dài prompt & output để tránh tốn chi phí hoặc OOM.
- Xử lý retry/backoff nếu LLM lỗi tạm thời.

---

## 7. Tiêu chí hoàn thành Phase 5

Phase 5 được coi là xong khi:

- [ ] Có module `analyzer` với types, prompt builder, client abstraction, service.
- [ ] Chạy được `npm run analyzer:once` trên 1–2 `Freebie` `status = 'raw'` và thấy các field phân tích được cập nhật trong DB.
- [ ] Có xử lý lỗi cơ bản (LLM trả về JSON lỗi, timeout, v.v.).
- [ ] Có ít nhất 1–2 test đơn giản cho phần parse/validate.

Sau Phase 5, pipeline `Ingestion → Analyzer` đã khép kín: dữ liệu từ internet được đưa vào DB và được chuẩn hoá thành thông tin hữu ích cho bạn.
