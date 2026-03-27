# Phase 6 — Dashboard & Feedback loop

> Mục tiêu: xây dựng UI tối giản để quan sát, lọc, và chỉnh sửa trạng thái của `Freebie`, đồng thời tạo vòng lặp feedback thủ công (bạn đánh dấu deal ngon/dở) để về sau cải thiện scoring & policy.

---

## 1. Mục tiêu kỹ thuật của Phase 6

- Tạo **dashboard Next.js** (App Router) hiển thị danh sách freebies.
- Cho phép **lọc/sort** theo một số trường quan trọng (score, status, category, valueUsd…).
- Cho phép **update trạng thái** thủ công: `claimed`, `ignored`, `pinned`, v.v.
- Xây dựng endpoint API/backend phục vụ UI, dùng lại service & repository đã tạo.

---

## 2. Thiết kế UI tổng quan

### 2.1. Trang chính: `/dashboard/freebies`

- Bảng (table) các cột đề xuất:
  - Title
  - Source
  - Category
  - Value (USD, nếu có)
  - Score
  - Status (new/analyzed/claimed/ignored/...)
  - Risk level
  - Eligible VN (icon yes/no)
  - Actions (view, mark claimed/ignored/pin)

- Thanh filter/search:
  - Text search theo title/source.
  - Filter theo status (checkbox/select).
  - Filter theo min score.
  - Filter theo category.

### 2.2. Trang chi tiết: `/dashboard/freebies/[id]`

- Hiển thị đầy đủ:
  - Tiêu đề, nguồn, link gốc (bấm mở tab mới).
  - summaryVi, steps (từ Analyzer).
  - Thông tin phân tích: valueUsd, expiry, riskLevel, eligibleVn, score.
  - Lịch sử claim (ClaimLog nếu có).
- Nút actions:
  - Mark as claimed / ignored / pinned.
  - (Về sau) Trigger re-analyze.

---

## 3. API & service layer cho dashboard

### 3.1. API list freebies

- Route (ví dụ): `GET /api/freebies` với query params:
  - `status`, `minScore`, `category`, `search`, `page`, `pageSize`.
- Dùng `freebie.service.ts` để:
  - Build query từ filter.
  - Trả về JSON + meta (total count, page info).

### 3.2. API detail & update

- `GET /api/freebies/[id]` → trả về thông tin chi tiết.
- `PATCH /api/freebies/[id]` → update `status`, `note`, etc.
  - Chỉ expose các field an toàn.

### 3.3. Mapping domain → DTO

- Tạo layer map từ Prisma model sang DTO trả cho frontend (để tách concerns, tránh leak toàn bộ schema). Có thể làm trực tiếp trong service.

---

## 4. Implementation chi tiết Next.js (App Router)

### 4.1. Cấu trúc thư mục

```text
src/app/
  dashboard/
    freebies/
      page.tsx         # list + filters
      [id]/page.tsx    # detail view
```

- Có thể dùng Server Components cho phần data fetch, kết hợp Client Components cho filter/form.

### 4.2. Data fetching patterns

- Tùy bạn chọn:
  - Fetch trực tiếp bằng Prisma trong Server Component (khi deploy self-host, chấp nhận coupling), hoặc
  - Gọi API routes ngay cả từ server component để giữ pattern REST rõ ràng.

- Phase 6 chỉ cần chọn 1 approach, không cần tối ưu sớm.

---

## 5. Feedback loop từ UI về hệ thống

### 5.1. Ghi nhận feedback thủ công

- Mỗi khi bạn:
  - Mark 1 freebie là `claimed` → tạo entry `ClaimLog` với `status = 'success'`, `mode = 'manual'`.
  - Mark `ignored` → log với status `ignored`.
- Lý do: dữ liệu này dùng sau này để:
  - Đánh giá score có hợp lý không.
  - Train điều chỉnh policy (Phase 7+).

### 5.2. Trường `note` hoặc tag

- Cho phép user nhập `note` ngắn trên UI (vd: "US-only", "value thấp", "setup phức tạp").
- Lưu vào `ClaimLog` hoặc field riêng trong `Freebie`.

---

## 6. Testing & UX considerations

- Test API list & detail chạy đúng filter.
- Test UI hiển thị được danh sách 50–100 freebies mà không lag quá nặng (có thể thêm pagination).
- Đảm bảo link mở ra trang promo gốc trong tab mới, tránh mất context dashboard.

Optional:
- Dùng một UI lib nhẹ (vd: Tailwind + headless components) cho nhanh; không cần overkill.

---

## 7. Tiêu chí hoàn thành Phase 6

Phase 6 được coi là xong khi:

- [ ] Trang `/dashboard/freebies` hiển thị được danh sách freebies từ DB với filter cơ bản.
- [ ] Trang detail `/dashboard/freebies/[id]` hiển thị đầy đủ thông tin phân tích & link gốc.
- [ ] Có thể cập nhật `status` (claimed/ignored/pinned/…) từ UI và thấy thay đổi trong DB.
- [ ] ClaimLog (hoặc cơ chế log tương đương) ghi lại được feedback từ UI.

Sau Phase 6, bạn đã có **một control panel thực thụ** cho CLV: thấy dòng dữ liệu, kết quả phân tích, và tương tác để dần biến hệ thống từ "bot đọc web" thành "assistant" gắn với hành vi thật của bạn.
