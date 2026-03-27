# Phase 8 — Semi-auto Execution (Tier A deals)

> Mục tiêu: triển khai tầng thực thi (executor) cho các deal Tier A (an toàn, không cần thẻ/KYC), ở chế độ **semi-auto**: hệ thống chuẩn bị mọi thứ và có thể auto điền form đơn giản, nhưng vẫn để bạn giữ quyền kiểm soát.

---

## 1. Mục tiêu kỹ thuật của Phase 8

- Xây dựng **executor module** có thể thực thi một số hành động chuẩn:
  - Mở URL claim.
  - Điền form signup cơ bản (email, password random, accept TOS).
- Gắn executor với **Policy Engine**: chỉ freebie có `action = 'auto_candidate'` mới được đề xuất/cho phép chạy.
- Thiết kế chế độ semi-auto:
  - Bạn trigger thủ công (từ CLI/UI).
  - Executor tự động làm các bước lặp lại.

---

## 2. Thiết kế executor layer

### 2.1. Kiến trúc module

```text
src/modules/execution/
  execution.types.ts
  execution.service.ts
  drivers/
    puppeteer.driver.ts   # hoặc playwright
```

### 2.2. Kiểu dữ liệu Executor

Trong `execution.types.ts`:

```ts
export type ExecutionMode = 'dry_run' | 'semi_auto' | 'auto';

export interface ExecutionContext {
  freebieId: string;
  url: string;
  mode: ExecutionMode;
  email?: string;        // account/email dùng để đăng ký
}

export interface ExecutionResult {
  success: boolean;
  error?: string;
  stepsLog: string[];    // log text từng bước
}
```

### 2.3. Driver browser automation

Trong `drivers/puppeteer.driver.ts` (hoặc Playwright):

- Hàm cơ bản:

```ts
export async function runSignupFlow(ctx: ExecutionContext): Promise<ExecutionResult> {
  // TODO: implement basic skeleton
}
```

- Phase 8 chỉ cần support 1–2 pattern đơn giản (VD: form với input email + nút submit). Không cần general hoá quá sớm.

---

## 3. Liên kết Policy → Executor

### 3.1. Chọn freebie đủ điều kiện

Trong `execution.service.ts`:

```ts
export async function getAutoCandidates(limit = 10) {
  const freebies = await freebieRepository.findAnalyzedWithHighScore(limit);
  return freebies.filter(f => {
    const policyInput = buildPolicyInputFromFreebie(f);
    const decision = decidePolicy(policyInput);
    return decision.action === 'auto_candidate' && decision.tier === 'A';
  });
}
```

### 3.2. Chạy semi-auto cho một freebie

```ts
export async function executeFreebie(freebieId: string, mode: ExecutionMode): Promise<ExecutionResult> {
  const freebie = await freebieRepository.findById(freebieId);
  if (!freebie) throw new Error('Freebie not found');

  const policyInput = buildPolicyInputFromFreebie(freebie);
  const decision = decidePolicy(policyInput);

  if (decision.action !== 'auto_candidate' || decision.tier !== 'A') {
    throw new Error('Freebie is not eligible for semi-auto execution');
  }

  const ctx: ExecutionContext = {
    freebieId: freebie.id,
    url: freebie.url,
    mode,
    // email có thể lấy từ config hoặc input người dùng
  };

  const result = await runSignupFlow(ctx);

  await claimLogService.logExecutionResult(freebie.id, result, mode);

  return result;
}
```

---

## 4. Giao diện chạy Semi-auto Execution

### 4.1. Từ CLI

- Script `scripts/run-execution.ts`:

```ts
import { getAutoCandidates, executeFreebie } from '@/modules/execution/execution.service';

async function main() {
  const candidates = await getAutoCandidates(5);
  for (const f of candidates) {
    console.log(`Candidate: ${f.title} (${f.url})`);
    // yêu cầu confirm từ CLI trước khi chạy
    const result = await executeFreebie(f.id, 'semi_auto');
    console.log(result);
  }
}

main().then(() => process.exit(0));
```

### 4.2. Từ Dashboard (optional)

- Thêm nút "Run semi-auto" trên trang detail `/dashboard/freebies/[id]`.
- Gọi API `POST /api/freebies/[id]/execute` với `mode='semi_auto'`.
- Hiển thị log kết quả (success/error, steps).

---

## 5. Ghi log & ClaimLog

- Mỗi lần executor chạy:
  - Tạo/ghi `ClaimLog` với:
    - `status = success/failed`.
    - `mode = 'semi_auto'`.
    - `note` = summary ngắn + error nếu có.
  - Có thể lưu raw log (stepsLog) vào bảng riêng hoặc file log (tuỳ volume).

---

## 6. Giới hạn & guardrails cho Phase 8

- Chỉ chạy trên **Tier A** (no card, low risk) như đã định ở Phase 7.
- Có timeout & max steps trong flow browser để tránh treo.
- Không điền thông tin nhạy cảm (card, ID).
- Chạy trên account/email riêng cho CLV, không dùng tài khoản cá nhân chính.

---

## 7. Tiêu chí hoàn thành Phase 8

Phase 8 được coi là xong khi:

- [ ] Tồn tại module `execution` với types, service, và driver cơ bản (puppeteer/playwright).
- [ ] Có thể lấy danh sách auto candidates từ DB dựa trên scoring + policy.
- [ ] `executeFreebie` chạy được cho ít nhất 1–2 deal demo Tier A, cập nhật ClaimLog tương ứng.
- [ ] Có guardrails cơ bản (check policy trước khi chạy, timeout, logging).

Sau Phase 8, CLV không chỉ dừng ở mức "đọc & gợi ý" mà đã bắt đầu **tự hành động ở mức an toàn**, chuẩn bị nền cho các chế độ auto mạnh hơn (nếu sau này bạn muốn).
