# CLV Tier Policy

> Tài liệu canonical định nghĩa Tier A/B/C và mode Clean/Grey cho CLV. Mọi thành phần scoring, policy, dashboard và execution đều tham chiếu file này làm nguồn sự thật duy nhất.

---

## 1. Mục tiêu của hệ thống Tier

Hệ thống Tier giúp CLV:

- Phân loại rủi ro của từng deal **độc lập với giá trị tuyệt đối**.
- Quyết định mức độ automation phù hợp: hiển thị mạnh, gợi ý semi-auto, hay chỉ lưu tham khảo.
- Tách bạch phán đoán LLM (Analyzer) và quyết định vận hành (Policy).
- Đảm bảo guardrails không bị bypass theo từng deal.

---

## 2. Định nghĩa Tier

### Tier A — Low-risk, high-usability

**Mô tả**: deal có thể claim được thực tế bởi 1 người dùng cá nhân ở Việt Nam với ma sát thấp và rủi ro tối thiểu.

**Điều kiện cần**:
- `eligible_vn = true`
- `risk_level` ∈ `{ low }`
- `card_required = false` HOẶC card chỉ dùng để verify, không tính tiền ngay
- `kyc_required = false` hoặc chỉ email/phone verify thông thường
- `friction_level` ∈ `{ low, medium }`
- Không có dấu hiệu rõ ràng vi phạm ToS khi claim

**Hành vi hệ thống**:
- Hiển thị nổi bật trên dashboard
- Là **candidate hợp lệ cho semi-auto execution** (Phase 8+)
- Được notify ưu tiên nếu có notification module

---

### Tier B — Medium-risk, cautious proceed

**Mô tả**: deal usable nhưng có yếu tố cần thận trọng — có thể claim được nhưng nên review thủ công trước.

**Điều kiện đặc trưng** (bất kỳ 1 trong số này):
- `card_required = true` (thẻ thật, có nguy cơ charge)
- `kyc_required = true` (cần xác minh danh tính)
- `friction_level = high`
- `risk_level = medium`
- Có giới hạn eligibility không chắc chắn cho VN
- Expiry ngắn hoặc điều kiện không hoàn toàn rõ ràng

**Hành vi hệ thống**:
- Hiển thị trên dashboard với badge "Thận trọng" hoặc tương đương
- **Không** là candidate cho semi-auto execution mặc định
- Người dùng phải chủ động review và quyết định

---

### Tier C — High-risk or low-confidence

**Mô tả**: deal rủi ro cao, khó xác minh, hoặc LLM không đủ thông tin để đưa ra phán đoán đáng tin.

**Điều kiện đặc trưng** (bất kỳ 1 trong số này):
- `risk_level = high`
- `eligible_vn = false` hoặc không xác định được
- Yêu cầu VPN, multi-account, hoặc workaround ToS
- `score < 30` sau khi scoring
- Thông tin deal quá mơ hồ hoặc mâu thuẫn

**Hành vi hệ thống**:
- Lưu vào DB nhưng **ẩn mặc định** trên dashboard
- Không đề xuất claim, không semi-auto
- Hiển thị chỉ khi user bật filter "Xem tất cả / Tier C"

---

## 3. Mode vận hành: Clean vs Grey

### Clean Mode (default)

- Chỉ claim deal không vi phạm ToS rõ ràng.
- Không dùng VPN để spoof region.
- Không dùng thẻ ảo để bypass card-required.
- Không tạo tài khoản phụ.
- Phù hợp 100% với Tier A và một phần Tier B.

### Grey Mode (opt-in, có cảnh báo)

- Cho phép dùng thẻ ảo (virtual card) để giảm rủi ro charge.
- Cho phép một số workaround nhẹ không phải multi-account.
- **Không** bật mặc định.
- Khi bật: hệ thống log rõ `mode = grey` vào ClaimLog.
- Tier C vẫn **không** được execute dù đang ở Grey Mode.

> Quy ước: `UserPrefs.mode` lưu `clean` hoặc `grey`. Policy module đọc giá trị này khi đánh giá execution eligibility.

---

## 4. Guardrails bắt buộc

Các guardrail sau áp dụng **bất kể tier hay mode**:

| Guardrail | Mô tả |
|---|---|
| No payment capture | Không lưu hoặc điền thông tin thẻ thật vào form ngoài |
| No multi-account | Không tạo tài khoản phụ cho cùng 1 service |
| No identity forgery | Không tạo CMND/passport giả hoặc bypass KYC thật |
| Panic switch | Có thể tắt toàn bộ execution ngay lập tức qua 1 flag |
| Dry-run mode | Mọi execution plan phải chạy được ở dry-run trước |
| Evidence logging | Mọi claim attempt phải có log và screenshot |

---

## 5. Mapping Tier theo phase

| Phase | Tier xử lý | Ghi chú |
|---|---|---|
| Phase 4–5 | Tất cả (ingest + analyze) | Assign tier_hint nhưng chưa enforce policy |
| Phase 6 | A, B hiển thị; C ẩn | Dashboard MVP |
| Phase 7 | A, B, C đầy đủ | Scoring + Policy engine hoàn chỉnh |
| Phase 8 | Chỉ Tier A | Semi-auto execution |
| Phase 9+ | Tier A + B review | Supervisor agent có thể escalate B lên A sau review |

---

## 6. Tier override

Trong một số trường hợp, user có thể override tier thủ công:

- **Override lên**: nâng Tier C → B, hoặc B → A sau khi review và chấp nhận rủi ro.
- **Override xuống**: hạ Tier A → B/C nếu user không tin tưởng nguồn.
- Override phải được log vào `ClaimLog` hoặc `FreebieNote` với lý do.
- Override **không** thay đổi kết quả Analyzer, chỉ thay đổi policy decision.

---

## 7. Checklist thiết kế trước khi code Policy module

- [ ] `classifyTier(freebie, prefs)` trả về `A | B | C` dựa trên bảng điều kiện trên
- [ ] `evaluateExecutionPolicy(freebie, prefs)` trả về `allow | suggest | block`
- [ ] `isAutoCandidate(freebie, prefs)` chỉ `true` khi Tier A + mode phù hợp
- [ ] Mọi output policy có thể log được
- [ ] Có unit test cho edge cases: card_required + low risk, eligible_vn false, friction high
