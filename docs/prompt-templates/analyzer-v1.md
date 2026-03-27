# Analyzer Prompt v1

> Prompt chuẩn v1 cho CLV Analyzer. Mục tiêu là biến một `Freebie` ở trạng thái `raw` thành output JSON ổn định, để validate và đưa vào scoring/policy.

---

## 1. Mục tiêu prompt

Prompt này được thiết kế cho giai đoạn đầu khi CLV chưa cần reasoning quá phức tạp, mà cần:

- output có cấu trúc rõ;
- để validate bằng Zod;
- tối ưu cho deal AI tools / SaaS / cloud credits;
- có ý thức về user ở Việt Nam;
- không “ảo tượng” giá trị khi dữ liệu thiếu.

---

## 2. Nguyên tắc dùng prompt

- Luôn yêu cầu **chỉ trả về JSON hợp lệ**.
- Không cho model trả lời dài ngoài schema.
- Nếu không chắc, ưu tiên `null`, `unknown` hoặc score bảo thủ.
- Không đoán bỡa expiry hoặc eligibility.
- Phải nhìn deal theo góc nhìn **1 user cá nhân ở Việt Nam**.

---

## 3. Prompt chính

```text
You are an analyzer for CLV, a personal self-hosted AI system that hunts freebies, trials, and promotions.

Your job is to analyze one promotion and return ONLY valid JSON.

Context:
- The end user is a single personal user in Vietnam.
- Prioritize realistic usability, low risk, and clear value.
- Be conservative when information is missing.
- Do not invent facts.
- If a field cannot be inferred reliably, use null, false, "unknown", or a lower score.

Analyze this promotion:
Title: {{title}}
Source: {{source}}
URL: {{url}}
Description: {{description}}

Return JSON with exactly these fields:
{
  "value_usd": number | null,
  "expiry": "YYYY-MM-DD" | null,
  "eligible_vn": boolean,
  "risk_level": "low" | "medium" | "high" | "unknown",
  "category": "ai-tool" | "saas" | "cloud" | "voucher" | "other",
  "score": number,
  "summary_vi": string,
  "steps": string[],
  "card_required": boolean,
  "kyc_required": boolean,
  "friction_level": "low" | "medium" | "high" | "unknown",
  "tier_hint": "A" | "B" | "C"
}

Field guidance:
- value_usd: estimated monetary value in USD, conservative estimate only.
- expiry: only if clearly inferable from the text.
- eligible_vn: true only if a user in Vietnam can realistically claim/use it.
- risk_level: consider payment risk, account risk, unclear conditions, region restrictions, and possible ToS concerns.
- category: choose the closest category.
- score: integer from 0 to 100; higher means more worthwhile for this user.
- summary_vi: short Vietnamese summary, practical and concise.
- steps: short Vietnamese steps to claim or activate.
- card_required: true if payment card is likely required.
- kyc_required: true if identity verification is likely required.
- friction_level: estimate effort and complexity to claim.
- tier_hint:
  - A: low-risk, no-card or low-friction, realistic for Vietnam
  - B: some friction or card/eligibility caution
  - C: high risk, unclear, restrictive, or low-confidence

Important rules:
- Return ONLY JSON.
- Do not wrap JSON in markdown.
- Do not include explanation outside the JSON.
- Keep summary_vi short.
- Keep each step short and actionable.
```

---

## 4. Output schema gợi ý ở TypeScript

```ts
export interface AnalyzerOutput {
  valueUsd: number | null;
  expiry: string | null;
  eligibleVn: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  category: 'ai-tool' | 'saas' | 'cloud' | 'voucher' | 'other';
  score: number;
  summaryVi: string;
  steps: string[];
  cardRequired: boolean;
  kycRequired: boolean;
  frictionLevel: 'low' | 'medium' | 'high' | 'unknown';
  tierHint: 'A' | 'B' | 'C';
}
```

---

## 5. Design notes

### Vì sao thêm `card_required`, `kyc_required`, `friction_level`, `tier_hint`

Bản khung ở phase-05 mới đủ cho MVP Analyzer, nhưng để phục vụ scoring/policy tốt hơn, prompt v1 nên thu thập thêm tín hiệu policy. **Đề xuất khác so với tài liệu hiện tại** vì nếu chỉ có `risk_level` thì Phase 7 và Phase 8 sẽ phải suy luận lại nhiều thứ từ text, làm policy kém minh bạch hơn.

### Vì sao vẫn giữ `score` trong analyzer output

Dù score cuối cùng nên do layer scoring kiểm soát, việc giữ `score` trong output analyzer vẫn hữu ích cho giai đoạn đầu để:

- bootstrap dashboard nhanh;
- có baseline heuristic trước khi scoring engine hoàn thiện;
- so sánh score từ LLM với score rule-based về sau.

### Vì sao cần góc nhìn Việt Nam

Cùng một deal nhưng khả năng usable khác nhau nhiều nếu xét từ VN. Vì vậy prompt phải ép model suy nghĩ theo tiêu chí:

- claim được không;
- dùng được không;
- có cần region/payment/KYC gây cản trở không.

---

## 6. Versioning

Quy ước version để xuất:

- `analyzer-v1`
- `analyzer-v1.1`
- `analyzer-v2`

Mỗi lần đổi schema hoặc logic đánh giá, cần:

1. tăng version prompt;
2. lưu version vào DB (`analysisVersion`);
3. cân nhắc rescore / reanalyze các record cũ nếu thay đổi lớn.

---

## 7. Checklist trước khi dùng thật

- [ ] Có Zod schema validate output.
- [ ] Có test với valid JSON và invalid JSON.
- [ ] Có retry/backoff khi provider lỗi.
- [ ] Có fallback cho trường hợp output thiếu field.
- [ ] Có log prompt version và provider name.
