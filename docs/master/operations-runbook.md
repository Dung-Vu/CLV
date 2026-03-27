# Operations & Runbook

> Tài liệu này mô tả cách vận hành hàng ngày CLV, các quy trình chuẩn (SOP) và cách xử lý sự cố.

---

## 1. Vận hành hàng ngày (Day-to-day operations)

- Check-list buổi sáng/buổi tối:
  - Kiểm tra dashboard (số freebie mới, lỗi analyzer/executor).
  - Chạy `run-agents` nếu không có scheduler tự động.
- Các lệnh CLI thường dùng:
  - `npm run ingest:once`
  - `npm run analyzer:once`
  - `npm run agents:once`

---

## 2. Quản lý lịch (scheduling)

- Mô tả cách cấu hình cron/systemd để:
  - Chạy ingestion/analyzer theo giờ.
  - Chạy agents theo ngày/tuần.
- Ghi ví dụ cụ thể (cron expression, service file, v.v.).

---

## 3. Triển khai & cập nhật (Deploy & Update)

- Quy trình deploy lên VPS:
  - Pull code mới từ GitHub.
  - Chạy migration (`prisma migrate`).
  - Restart service (PM2/Nginx).
- Quy trình rollback đơn giản nếu bản mới lỗi.

---

## 4. Xử lý sự cố (Incident response)

- Các loại sự cố thường gặp:
  - Ingestion không lấy được dữ liệu.
  - Analyzer lỗi liên tục (LLM timeouts, JSON invalid).
  - Dashboard không load.
- Với mỗi loại:
  - Cách debug (log nào xem trước, lệnh nào chạy thử).
  - Cách khôi phục tạm thời (tắt 1 phần hệ thống, chạy thủ công, v.v.).

---

## 5. Bảo trì định kỳ

- Công việc theo chu kỳ (tuần/tháng/quý):
  - Dọn dữ liệu cũ (freebies đã hết hạn lâu).
  - Xoá log cũ hoặc rotate.
  - Kiểm tra index/hiệu năng DB.
  - Review config scoring/policy.

---

## 6. Tài liệu & liên kết hữu ích

- Link tới:
  - `system-architecture-deep-dive.md` (để hiểu kiến trúc khi debug sâu).
  - `security-privacy-compliance.md` (lưu ý khi thao tác với dữ liệu/secret).
  - `extension-experiment-playbook.md` (khi muốn thử nghiệm thay đổi lớn).
