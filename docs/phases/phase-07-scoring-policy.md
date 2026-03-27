# Phase 7 — Scoring & Chính sách (Policy Engine)

> Mục tiêu: gom toàn bộ logic chấm điểm (scoring) và quyết định hành động (policy) vào một layer riêng, thuần TypeScript, dễ test – để từ đó hệ thống biết freebie nào đáng ưu tiên, freebie nào đủ điều kiện auto/semi-auto.

---

## 1. Mục tiêu kỹ thuật của Phase 7

- Định nghĩa **score model** rõ ràng dựa trên các field từ Analyzer.
- Xây dựng **Policy Engine** quyết định action đề xuất cho mỗi freebie.
- Tách logic này khỏi UI/API để:
  - Dễ viết unit test.
  - Về sau tối ưu/tinh chỉnh dựa trên dữ liệu thật mà không động vào nhiều nơi.

---

## 2. Thiết kế score model

### 2.1. Các yếu tố ảnh hưởng score

Tối thiểu:
- `valueUsd` – giá trị ước tính.
- `riskLevel` – low/medium/high/unknown.
- `eligibleVn` – có claim được từ VN không.
- `expiry` – còn bao lâu hết hạn.
- `category` – ưu tiên loại phù hợp (ai-tool/saas/cloud...).

Có thể bổ sung sau:
- Lịch sử bạn đã claim & dùng thật (từ ClaimLog).
- Độ tin cậy của nguồn.

### 2.2. Module scoring

Tạo `src/modules/scoring/scoring.service.ts` (và `scoring.types.ts` nếu cần):

```ts
export interface ScoringContext {
  valueUsd: number | null;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  eligibleVn: boolean;
  expiry: Date | null;
  category: string;
  source: string;
}

export interface ScoringResult {
  score: number;   // 0-100
  reasons: string[]; // optional: giải thích ngắn
}

export function computeScore(ctx: ScoringContext): ScoringResult {
  // TODO: implement
}
```

Logic cụ thể bạn có thể refine khi code, nhưng Phase 7 cần chốt được form function + test.

---

## 3. Thiết kế Policy Engine

### 3.1. Policy input/output

Tạo `src/modules/policy/policy.service.ts`:

```ts
export type DealTier = 'A' | 'B' | 'C';

export type ActionRecommendation =
  | 'ignore'
  | 'consider_manual'
  | 'strong_suggest'
  | 'auto_candidate';

export interface PolicyInput {
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  eligibleVn: boolean;
  requiresCard: boolean;   // nếu có field này sau này
  category: string;
}

export interface PolicyDecision {
  tier: DealTier;
  action: ActionRecommendation;
}

export function decidePolicy(input: PolicyInput): PolicyDecision {
  // TODO: implement
}
```

### 3.2. Mapping từ Freebie → PolicyInput

Trong service (hoặc một helper):

```ts
export function buildPolicyInputFromFreebie(freebie: Freebie): PolicyInput {
  return {
    score: freebie.score ?? 0,
    riskLevel: mapRisk(freebie.riskLevel),
    eligibleVn: freebie.eligibleVn,
    requiresCard: detectRequiresCard(freebie), // tạm thời false nếu chưa có field
    category: freebie.category ?? 'other',
  };
}
```

`detectRequiresCard` có thể là placeholder (luôn false) cho đến khi bạn thêm field hoặc phân tích text chi tiết hơn.

---

## 4. Config hoá các ngưỡng & trọng số

Thay vì hard-code trong hàm, tạo `config` riêng:

```ts
// src/config/scoring.ts
export const SCORING_CONFIG = {
  minValueUsd: 10,
  highValueUsd: 50,
  expirySoonDays: 3,
  categoryWeights: {
    'ai-tool': 1.0,
    saas: 0.9,
    cloud: 0.8,
    other: 0.5,
  },
};

// src/config/policy.ts
export const POLICY_CONFIG = {
  autoCandidateScoreMin: 80,
  strongSuggestScoreMin: 60,
};
```

Hàm `computeScore` và `decidePolicy` đọc từ config này để dễ tune.

---

## 5. Áp dụng scoring/policy vào Freebie

### 5.1. Batch scoring

- Sau khi Analyzer cập nhật một freebie, hoặc theo batch cron, gọi `computeScore` để set `freebie.score`.

```ts
export async function rescoreAnalyzedFreebies(limit = 50) {
  const freebies = await freebieRepository.findAnalyzedWithoutScore(limit);
  for (const f of freebies) {
    const ctx = buildScoringContext(f);
    const result = computeScore(ctx);
    await freebieRepository.updateScore(f.id, result.score);
  }
}
```

### 5.2. Policy flag trên Freebie

- Ngoài DB, có thể thêm field `actionHint` hoặc `tier` vào Freebie nếu muốn lưu.
- Hoặc chỉ compute-on-read khi dashboard cần hiển thị đề xuất.

---

## 6. Testing

- Viết unit test cho:
  - `computeScore` với các trường hợp: value cao/risk thấp → score cao; risk cao → score thấp, v.v.
  - `decidePolicy` với các combination (score, risk, eligibleVn) để đảm bảo logic đúng với intuition.
- Đảm bảo thay đổi config không làm test mất ý nghĩa (có thể mock config trong test).

---

## 7. Tiêu chí hoàn thành Phase 7

Phase 7 được coi là xong khi:

- [ ] Có module `scoring` với `computeScore` chạy được và có test.
- [ ] Có module `policy` với `decidePolicy` chạy được và có test.
- [ ] Có ít nhất một chỗ trong pipeline (sau Analyzer) gọi scoring để fill `Freebie.score`.
- [ ] Dashboard có thể hiển thị score và, nếu muốn, action recommendation/hint.

Sau Phase 7, hệ thống CLV không chỉ biết "đọc" và "hiểu" freebies, mà còn **biết đánh giá cái nào nên ưu tiên**, tạo tiền đề cho Phase 8 tự động hoá một phần hành động.
