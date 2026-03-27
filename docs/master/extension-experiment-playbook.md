# Extension & Experiment Playbook

> Tài liệu này là sổ tay cho việc mở rộng CLV (vertical mới, tính năng mới) và chạy các thử nghiệm (experiments) an toàn.

---

## 1. Nguyên tắc mở rộng

- Mọi mở rộng nên:
  - Dựa trên kiến trúc sẵn có (Collector, Analyzer, Scoring, Policy, Execution, Agents).
  - Thêm module/vertical mới mà không phá vỡ module cũ.
  - Đi kèm test tối thiểu.

---

## 2. Template cho vertical mới

- Checklist khi thêm 1 vertical (vd: food vouchers, ecommerce, cloud credits):
  1. Thêm nguồn mới vào `docs/sources.md` + `SOURCES`.
  2. Tạo collector (nếu cần) hoặc dùng collector sẵn có.
  3. Điều chỉnh Analyzer prompt/context nếu cần.
  4. Cập nhật scoring/policy (category, weight, rule đặc thù).
  5. Thêm filter/hiển thị mới trong Dashboard nếu cần.

---

## 3. Thiết kế & chạy experiments

- Ví dụ các loại experiment:
  - Thay đổi cấu hình scoring (weights, ngưỡng).
  - Thử model LLM khác cho Analyzer.
  - Thay đổi tần suất ingestion/analyzer.
- Gợi ý quy trình:
  1. Ghi rõ hypothesis (kỳ vọng).
  2. Ghi lại cấu hình cũ & mới.
  3. Chạy trong khoảng thời gian xác định.
  4. So sánh kết quả (số deal hữu ích, cảm nhận cá nhân).

---

## 4. Quản lý cấu hình và rollback

- Sử dụng file config tách biệt (vd: `config/scoring.*`, `config/policy.*`).
- Khi experiment:
  - Tạo bản sao config (A/B) hoặc dùng branch Git.
  - Có kế hoạch rollback nhanh nếu kết quả tệ.

---

## 5. Ghi chép & lesson learned

- Khuyến khích ghi lại:
  - Mỗi lần thêm vertical mới: what worked / what didn't.
  - Mỗi lần chỉnh scoring/policy lớn: hiệu ứng ra sao.
- Có thể lưu dưới dạng section theo thời gian (changelog cho experiments).

---

## 6. Ý tưởng tương lai

- Brainstorm các hướng đi tiềm năng:
  - Thêm khả năng tự sinh code collector mới từ mô tả (LLM-assisted dev).
  - Thêm UI để chỉnh config/scoring/policy không cần sửa code.
  - Kết nối CLV với các công cụ khác (Telegram bot, email digest hằng ngày).

Tài liệu này là nơi bạn tự do ghi chú ý tưởng, không cần quá formal – miễn là giúp bạn 6 tháng sau quay lại vẫn hiểu được đã thử gì và nên làm gì tiếp theo.
