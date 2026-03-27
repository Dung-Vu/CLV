# CLV Long-Term Strategy & Roadmap

> Chiến lược dài hạn từ A → "master project" cho hệ thống AI săn freebies toàn cầu CLV.

---

## 1. Tầm nhìn dự án

CLV không chỉ là một script săn khuyến mãi, mà là một **agent AI cá nhân** có khả năng:

- **Quan sát thế giới ưu đãi** (RSS, blog, Reddit, Twitter, ProductHunt, v.v.).
- **Hiểu** nội dung promo (AI tools, SaaS, cloud credit, referral...).
- **Đánh giá** giá trị, rủi ro, điều kiện áp dụng với user ở Việt Nam.
- **Đề xuất hoặc tự hành động** (claim/signup/referral) theo chính sách do bạn đặt ra.

Trạng thái cuối ("master project") là một hệ thống:

- Chạy **liên tục, ổn định** trên hạ tầng riêng (self-host VPS / home server).
- Có **bộ nhớ dài hạn**, biết lịch sử claim, sở thích, stack của bạn.
- Có **workflow agentic**: nhiều tác vụ nhỏ (scanner, analyzer, executor) phối hợp với nhau.
- Có **UI trực quan** để bạn ra quyết định mức độ tự động hóa.

---

## 2. Nguyên tắc thiết kế cốt lõi

1. **Safety-first, value-first**
   - Chỉ ưu tiên những deal free / trial thực sự có giá trị với bạn.
   - Hạn chế auto-claim các trường hợp rủi ro (cần thẻ, cần KYC, grey ToS) cho tới khi hiểu rất rõ.

2. **Layered Architecture**
   - Chia rõ tầng: Ingestion → Normalization → AI Analyzer → Decision → Action.
   - Mỗi tầng có interface rõ, để sau này dễ thay đổi model, nguồn, cách claim.

3. **Human-in-the-loop trước, Autonomous sau**
   - Ban đầu, CLV đóng vai trò "cố vấn" (advisor) – bạn vẫn là người bấm nút cuối.
   - Khi đã đủ tin tưởng, mới mở dần các chế độ auto cho từng loại deal (Tier A, B…).

4. **Observability & Logging**
   - Mọi hành động của agent (scan, phân tích, claim) phải được log lại.
   - Giúp debug khi có bug / bị ban / sai lệch scoring.

5. **Modularity & Extensibility**
   - Nguồn mới chỉ cần viết adapter mới.
   - Thêm loại deal mới (food, ecommerce) không đụng nhiều vào core.

---

## 3. Kiến trúc cấp cao

### 3.1. Sơ đồ khối

```text
┌───────────────────────────────────────────────────────────┐
│                          CLV                             │
├───────────────────────┬─────────────────┬────────────────┤
│   1. INGESTION        │ 2. ANALYZER     │ 3. DECISION &  │
│   (Collectors)        │ (LLM Engine)    │    ACTION      │
├───────────────────────┴─────────────────┴────────────────┤
│                 4. STORAGE & MEMORY (DB)                 │
├───────────────────────────────────────────────────────────┤
│                    5. USER INTERFACE                     │
└───────────────────────────────────────────────────────────┘
```

### 3.2. Các tầng chi tiết

1. **Ingestion Layer**
   - RSS & Freebies feeds: list các RSS/Atom của site săn free, blog tech.
   - Curated articles: các bài tổng hợp "Best Free AI Tools", "How to get X Pro for free".
   - Social (Phase 2+): Twitter/X, Reddit, Discord/Telegram, ProductHunt.

2. **Analyzer Layer (AI)**
   - LLM đọc title + description + context, xuất JSON chuẩn hoá:
     - `value_usd`, `expiry`, `eligible_vn`, `risk_level`, `category`, `score`, `summary_vi`, `steps`.
   - Có prompt template cố định và versioning.

3. **Decision & Action Layer**
   - Áp dụng rule + scoring để quyết định:
     - Bỏ qua / Gợi ý thủ công / Đề xuất mạnh / Auto-claim.
   - Định nghĩa policy theo Tier (A/B/C) và theo loại deal.

4. **Storage & Memory Layer**
   - PostgreSQL + Prisma với các model:
     - `Freebie` – lưu toàn bộ deals.
     - `UserPrefs` – cấu hình sở thích, ngưỡng giá trị, loại cho phép auto.
     - `ClaimLog` – log chi tiết từng lần claim.

5. **User Interface**
   - Dashboard Next.js:
     - Bảng freebie (lọc theo score, category, trạng thái).
     - Trang chi tiết 1 deal: mô tả, giá trị, hướng dẫn claim.
     - Trang analytics: tổng value ước tính đã claim.

---

## 4. Chiến lược theo giai đoạn (Roadmap từ A → master project)

### Phase 0 – Research & Design (hiện tại)

**Mục tiêu**: Hiểu bức tranh freebies & chốt kiến trúc.

- Xác định rõ:
  - Loại deal ưu tiên (AI tools, SaaS, cloud credit).
  - Các nguồn dữ liệu chính (10–20 sites/RSS/guide).
  - Các chỉ số bạn quan tâm: value, risk, eligibility, friction.
- Kết quả: README + STRATEGY (file này), mô tả kiến trúc & roadmap rõ ràng.

**Deliverables**:
- Danh sách nguồn (sẽ thêm vào `docs/sources.md`).
- Prompt template đầu tiên cho Analyzer.

---

### Phase 1 – Read-only Intelligence Agent (MVP thấp rủi ro)

**Mục tiêu**: CLV chỉ đọc & phân tích, chưa auto-claim.

#### 1.1. Ingestion MVP

- Chọn 3 nhóm nguồn đầu tiên:
  1. 2–3 bài tổng hợp "best free AI tools / free trials".
  2. 5–10 RSS/Atom từ danh sách freebies.
  3. 1–2 blog/guide chi tiết về Perplexity Pro free hoặc tương tự.

- Build collectors:
  - Mỗi collector chỉ cần trả về list items chuẩn `{title, url, description_raw, source}`.
  - Lưu vào DB với trạng thái `raw`.

#### 1.2. Analyzer MVP

- Dùng 1 model (ví dụ: Claude/Groq/OpenAI) với prompt dạng:

  ```jsonc
  {
    "value_usd": number,
    "expiry": "YYYY-MM-DD or null",
    "eligible_vn": boolean,
    "risk_level": "low|medium|high",
    "category": "ai-tool|saas|cloud|other",
    "score": 0-100,
    "summary_vi": string,
    "steps": ["..."]
  }
  ```

- Lưu output vào `Freebie`.
- Xây dashboard chỉ đọc để bạn review, chỉnh tay nếu cần.

#### 1.3. Thành công của Phase 1

- Có 20–50 deal đã được chuẩn hoá & chấm điểm.
- Bạn thấy rõ:
  - Bao nhiêu deal phù hợp người dùng ở Việt Nam.
  - Những pattern nào hay gặp (yêu cầu card, region lock, referral…).

---

### Phase 2 – Advisor Agent (Đề xuất hằng ngày)

**Mục tiêu**: CLV trở thành "cố vấn săn freebies" hằng ngày/tuần.

#### 2.1. Scoring & Policy

- Định nghĩa hàm score cụ thể, ví dụ:

  ```text
  score = w1 * value_norm - w2 * friction - w3 * risk + w4 * eligibility_bonus
  ```

- Xác định ngưỡng hiển thị:
  - `score >= 70`: đề xuất mạnh.
  - `50 <= score < 70`: đề xuất yếu.
  - `< 50`: ẩn khỏi view mặc định.

- Định nghĩa Tier auto-claim (chưa bật auto ở Phase 2, nhưng chuẩn bị):
  - Tier A: no card, no KYC, region global.
  - Tier B: card required nhưng cancel dễ.
  - Tier C: high risk / random giveaway.

#### 2.2. Workflow hằng ngày

- Cron hàng ngày:
  - Ingest nguồn mới.
  - Analyzer chạy trên item mới.
  - Store & score.

- Dashboard "Today’s top deals":
  - Top N deals trong ngày/tuần.
  - Bạn có thể mark `claimed` / `ignored`.

#### 2.3. Thành công của Phase 2

- Bạn thực sự **claim được vài deal giá trị cao** (trên giấy tờ), đồng thời hiểu rõ kiểu deal mình thích.
- Hệ thống không làm phiền quá nhiều – chỉ đưa ra suggestion lọc kỹ.

---

### Phase 3 – Selective Auto-Execution (Semi-Autonomous)

**Mục tiêu**: Bắt đầu cho CLV thực sự "làm thay" một số bước an toàn.

#### 3.1. Xây Policy Auto-Claim

- Trong `UserPrefs`:
  - Cho phép bật auto-claim cho **Tier A**.
  - Đặt ngưỡng score tối thiểu để auto.

- Ví dụ policy:
  - `auto_claim = true` nếu:
    - `Tier = A`.
    - `score >= 80`.

#### 3.2. Executor Layer (Action)

- Thiết kế executor theo step:
  1. Mở URL claim trong môi trường headless (Puppeteer / Playwright).
  2. Điền email (có thể là email riêng cho CLV).
  3. Thực hiện các bước đơn giản (tick checkbox, submit form).
  4. Log kết quả + screenshot.

- Không động vào card / thanh toán ở Phase 3.

#### 3.3. Observability & Guardrails

- Mọi hành động auto phải:
  - Ghi rõ input (deal id, policy matched, thời gian).
  - Capture log/screenshot nếu có lỗi.

- Cần nút "panic" dễ dàng disable auto-claim nếu phát hiện hành vi bất thường.

#### 3.4. Thành công của Phase 3

- Bạn thấy mình **ít phải tự signup** mấy deal đơn giản.
- Không có incident nghiêm trọng (mất tiền, bị khoá account chính, v.v.).

---

### Phase 4 – Multi-Agent & Personalization (Hướng tới master project)

**Mục tiêu**: Biến CLV từ 1 agent đơn lẻ thành hệ thống **nhiều agent phối hợp**, có khả năng tự-refine chiến lược.

#### 4.1. Vai trò agent chuyên môn

Ví dụ kiến trúc multi-agent:

- **Supervisor Agent**: nhận mục tiêu tổng thể (tối đa hoá value/month, giữ risk thấp).
- **Research Agent**: tìm nguồn, đề xuất feed/website mới để ingest.
- **Analysis Agent**: tối ưu scoring, phát hiện pattern mới.
- **Execution Agent**: phụ trách part auto-claim theo policy.
- **Memory Agent**: tóm tắt lịch sử claim, rút kinh nghiệm.

#### 4.2. Vòng lặp tự cải thiện

- Định kỳ (ví dụ mỗi tuần), Supervisor Agent:
  - Đọc thống kê: bao nhiêu deal claim thành công, value ước tính, tỉ lệ bạn thực sự dùng.
  - Đề xuất điều chỉnh: tăng/giảm trọng số score, thêm/bớt nguồn, siết/giảm auto-claim.

- Bạn vẫn có quyền duyệt đề xuất trước khi áp dụng.

#### 4.3. Mở rộng lĩnh vực

Khi lõi "freebies AI/SaaS" đã ổn định, thêm các module:

- Voucher đồ ăn (ShopeeFood, GrabFood) – dùng AccessTrade.
- Voucher TMĐT (Shopee, Lazada, Tiki).
- Các chương trình loyalty, cashback.

Mọi thứ dùng lại chung **Ingestion + Analyzer + Decision**; chỉ khác adapter & policy.

---

## 5. Quản trị rủi ro & đạo đức

### 5.1. Ranh giới grey-hat

- Một số chiến lược (VPN region spoof, multi-account, dùng số US ảo) có thể vi phạm ToS.
- Cần rõ:
  - Mode "Clean" (chỉ deal hoàn toàn hợp lệ với VN, không fake gì).
  - Mode "Grey" (chấp nhận rủi ro nhất định, chạy trên hạ tầng tách biệt, account disposable).

### 5.2. Bảo vệ danh tính & tài chính cá nhân

- Tách account/email dùng cho CLV khỏi email chính.
- Không lưu card thật trong flow auto-claim.
- Với deal yêu cầu card, luôn để ở chế độ manual.

### 5.3. Tính minh bạch

- Hệ thống phải giải thích được vì sao một deal được chấm score cao.
- Log rõ: nguồn, phân tích của AI, lý do gợi ý hoặc auto-claim.

---

## 6. KPI & cách đánh giá tiến độ

Để biết bạn đang đi đúng hướng, có thể track:

- **Số deal đã phân tích** (Freebie count).
- **Số deal thực sự claim**.
- **Tổng value ước tính** (sum value_usd của deal claim).
- **% deal bạn thực sự dùng** sau khi claim.
- **Số incident** (lỗi, vi phạm, bị chặn, mất tiền…).

Theo phase:

- Sau Phase 1: có ít nhất 20–50 deal chuẩn hoá, dashboard hoạt động OK.
- Sau Phase 2: mỗi tuần có vài đề xuất tốt, bạn claim được giá trị rõ ràng.
- Sau Phase 3: ít nhất 1–2 loại deal được auto-claim ổn định.
- Sau Phase 4: hệ thống có vòng lặp tự cải thiện (weekly review & điều chỉnh).

---

## 7. Công việc tiếp theo (Next Steps)

Ngay sau file chiến lược này, thứ tự ưu tiên đề xuất:

1. Tạo `docs/sources.md` liệt kê cụ thể 10–20 nguồn đầu tiên muốn ingest.
2. Chuẩn hoá & lưu lại **prompt Analyzer** thực tế (phiên bản v1).
3. Định nghĩa rõ `Tier A/B/C` và chính sách ràng buộc.
4. Thiết kế schema chi tiết cho `ClaimLog` + tiêu chuẩn logging.

Khi 4 việc trên xong, bạn có blueprint hoàn chỉnh để bất kỳ lúc nào muốn code, chỉ việc triển khai từng phase – không cần nghĩ lại từ đầu.
