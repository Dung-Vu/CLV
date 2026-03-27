# Phase 3 — Thiết kế kiến trúc & schema dữ liệu

> Mục tiêu: chốt kiến trúc module trong codebase và define đầy đủ Prisma schema cho các entity cốt lõi (Freebie, UserPrefs, ClaimLog), nhưng chưa cần viết business logic ingest/analyze.

---

## 1. Mục tiêu kỹ thuật của Phase 3

- Thiết kế **module boundaries** trong `src/` để tránh spaghetti code khi dự án lớn dần.
- Định nghĩa **schema.prisma** đầy đủ cho các bảng chính.
- Khởi tạo **Prisma Client**, migration đầu tiên, đảm bảo DB hoạt động.
- Tạo các **service stub** tương ứng với domain (vd: `FreebieService`) với chữ ký hàm rõ ràng nhưng chưa cần full implementation.

---

## 2. Kiến trúc module đề xuất

Trong thư mục `src/`, chia theo domain + layer:

```text
src/
  app/                 # Next.js routes (UI + API routes)
  lib/
    db.ts              # khởi tạo PrismaClient
    logger.ts          # logging helper (optional)
    config.ts          # load env, config chung
  modules/
    freebies/          # domain chính cho Freebie
      freebie.model.ts # type/domain model (nếu cần tách khỏi Prisma)
      freebie.service.ts
      freebie.repository.ts
    ingestion/
      ingestion.service.ts
      ingestion.types.ts
    analyzer/
      analyzer.service.ts
    users/
      user-prefs.service.ts
      user-prefs.repository.ts
    claims/
      claim-log.service.ts
      claim-log.repository.ts
```

Phase 3 tập trung vào:
- `lib/db.ts`
- `modules/freebies/*`
- `modules/users/*`
- `modules/claims/*`
- File `schema.prisma` tương ứng.

---

## 3. Thiết kế schema.prisma

Dựa trên phác thảo trong `long-term-strategy.md`, refine thành schema cụ thể hơn (có thể điều chỉnh khi code):

```prisma
model Freebie {
  id          String   @id @default(cuid())
  title       String
  source      String
  url         String
  description String?

  valueUsd    Float?
  expiry      DateTime?
  eligibleVn  Boolean  @default(false)
  riskLevel   String   @default("unknown")
  score       Float    @default(0)

  status      String   @default("new") // new/claimed/expired/ignored
  category    String   @default("unknown")

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  claimLogs   ClaimLog[]
}

model UserPrefs {
  id            String   @id @default(cuid())
  minValueUsd   Float    @default(20)
  categories    String[] @default([])
  autoClaim     Boolean  @default(false)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // tuỳ bạn muốn link với user identity nào (nếu có multi-user sau này)
}

model ClaimLog {
  id          String   @id @default(cuid())
  freebieId   String
  freebie     Freebie  @relation(fields: [freebieId], references: [id])

  status      String   // success/failed/manual/auto
  mode        String   // manual/semi-auto/auto
  note        String?

  createdAt   DateTime @default(now())
}
```

> Lưu ý: Tên field & type có thể điều chỉnh khi coding thật, đây là khung để bắt đầu.

---

## 4. Công việc triển khai code trong Phase 3

### 4.1. Thiết lập Prisma & DB

- Cài đặt Prisma & client (nếu chưa ở Phase 1):
  - `npm install prisma @prisma/client`
  - `npx prisma init`
- Điền `DATABASE_URL` trong `.env` để trỏ tới Postgres.
- Thay nội dung `schema.prisma` bằng design ở trên (điều chỉnh nếu cần).
- Chạy:
  - `npx prisma migrate dev --name init`
  - `npx prisma generate`

### 4.2. Tạo helper `lib/db.ts`

- Tạo file `src/lib/db.ts`:
  - Export singleton `PrismaClient`.
  - Handle hot-reload trong dev (pattern phổ biến với Next.js).

### 4.3. Tạo các service/repository stub

Ví dụ trong `src/modules/freebies/`:

- `freebie.repository.ts`:
  - Các hàm cơ bản: `createOrUpdate`, `findById`, `findMany`, `updateStatus`.
- `freebie.service.ts`:
  - Hàm dùng ở layer trên: `listFreebiesForDashboard`, `markAsClaimed`, v.v.

Trong `src/modules/users/` và `src/modules/claims/` làm tương tự, nhưng chỉ cần chữ ký hàm, thân hàm có thể `TODO` hoặc minimal.

### 4.4. (Optional) Định nghĩa type domain

- Nếu muốn tách type domain khỏi Prisma type, tạo `freebie.model.ts` với interface thuần TypeScript và mapper từ Prisma sang domain.

---

## 5. Tiêu chí hoàn thành Phase 3

Phase 3 được coi là xong khi:

- [ ] `schema.prisma` có đầy đủ 3 model Freebie, UserPrefs, ClaimLog (hoặc nhiều hơn nếu bạn cần).
- [ ] Migration đầu tiên chạy thành công, DB tạo bảng OK.
- [ ] Có `lib/db.ts` export PrismaClient, dùng được ở các module khác.
- [ ] Có các file `freebie.repository.ts`, `freebie.service.ts`, `user-prefs.*`, `claim-log.*` với chữ ký hàm rõ ràng.
- [ ] Ít nhất 1–2 test đơn giản prove rằng Prisma client hoạt động (insert/select cơ bản).

Sau Phase 3, bạn đã có **xương sống dữ liệu & module structure**, sẵn sàng cho Phase 4 implement collectors đọc từ `SOURCES` và đổ vào bảng `Freebie`.
