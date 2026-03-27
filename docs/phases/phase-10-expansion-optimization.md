# Phase 10 — Mở rộng lĩnh vực & tối ưu hoá dài hạn

> Mục tiêu: biến CLV từ một PoC mạnh thành hệ thống có thể mở rộng sang nhiều loại freebies/voucher khác nhau, dễ bảo trì, tối ưu hiệu năng & chi phí, và có quy trình cải tiến liên tục.

---

## 1. Mục tiêu kỹ thuật của Phase 10

- Thêm **lĩnh vực/loại deal mới** (food vouchers, ecommerce, cloud credits, v.v.) dựa trên kiến trúc sẵn có.
- Cải thiện **performance & reliability** của các pipeline chính.
- Tăng cường **observability** (metrics, logs, alert đơn giản).
- Chuẩn hoá **quy trình cải tiến** (iteration loop) khi bạn sử dụng CLV lâu dài.

---

## 2. Mở rộng lĩnh vực (new verticals)

### 2.1. Thêm category mới

- Ví dụ: `food`, `ecommerce`, `gaming`, `education`, `devtools`, v.v.
- Bước code cần làm:
  - Bổ sung category vào config (nếu có enum/constant).
  - Điều chỉnh `AnalyzerOutput.category` và mapping.
  - Cập nhật `SCORING_CONFIG.categoryWeights` để reflect ưu tiên mới.

### 2.2. Thêm nguồn & collector cho vertical mới

- Cập nhật `docs/sources.md` và `SOURCES` với các nguồn mới (vd: API AccessTrade, RSS site săn mã giảm giá VN).
- Implement collector mới (ví dụ: `accesstrade.collector.ts`) nhưng tái sử dụng interface `Collector` hiện có.
- Đảm bảo collector mới **không phá vỡ** collector cũ (được test riêng).

### 2.3. Điều chỉnh Analyzer cho vertical đặc thù

- Với một số vertical (vd: cloud credit, voucher VN), bạn có thể:
  - Thêm logic hậu xử lý sau khi LLM trả kết quả.
  - Điều chỉnh prompt (thêm context: quốc gia, loại dịch vụ).

---

## 3. Tối ưu hiệu năng & chi phí

### 3.1. Tối ưu LLM calls

- Batch processing: giới hạn số freebie phân tích mỗi lần.
- Cache: không gọi lại LLM cho cùng một mô tả nếu không cần.
- Chia model tier:
  - Model rẻ/nhanh cho pre-filter.
  - Model tốt hơn cho deal có tiềm năng cao.

### 3.2. Tối ưu DB & queries

- Thêm index cho các cột thường filter/sort (status, score, category, createdAt).
- Audit các query nặng trong dashboard & agent runner.

### 3.3. Tối ưu resource runtime

- Điều chỉnh tần suất cron/agent runner dựa theo usage thực tế.
- Scale theo chiều dọc (tăng tài nguyên) hoặc chia service (nếu cần) khi khối lượng lớn.

---

## 4. Observability & reliability

### 4.1. Logging chuẩn hoá

- Đảm bảo mọi module (ingestion, analyzer, scoring, execution, agents) dùng chung logger.
- Format log consistent (level, timestamp, module, message).

### 4.2. Metrics cơ bản

- Đếm:
  - Số freebie mới/ngày.
  - Số analyze thành công/thất bại.
  - Số execution semi-auto thành công/thất bại.
- Có thể lưu vào DB hoặc một file/metrics endpoint đơn giản.

### 4.3. Alert đơn giản

- Nếu trong X giờ không có freebie mới hoặc Analyzer lỗi liên tục:
  - Gửi notify (email/Telegram) cho bạn.

---

## 5. Quy trình cải tiến liên tục

### 5.1. Chu kỳ review định kỳ

- Mỗi tuần/tháng:
  - Dùng Dashboard + Agent log để xem:
    - Deal nào thực sự useful.
    - Deal nào score cao nhưng bạn luôn ignore → cần hạ weight.
  - Điều chỉnh `SCORING_CONFIG` và `POLICY_CONFIG` tương ứng.

### 5.2. Thử nghiệm (experiments)

- Tạo nhánh config A/B (vd: 2 cấu hình scoring khác nhau) và so sánh:
  - Số deal được bạn chọn.
  - Tổng value ước tính.

### 5.3. Document hoá

- Cập nhật `docs/master/extension-experiment-playbook.md` với:
  - Các bài học.
  - Pattern vertical mới.
  - Hướng dẫn thêm nguồn/collector/analyzer đặc thù.

---

## 6. Tiêu chí hoàn thành Phase 10

Phase 10 là phase dài hạn, nhưng có thể coi là "đã đạt baseline" khi:

- [ ] Thêm ít nhất 1 vertical mới (ngoài AI/SaaS) chạy ổn định qua pipeline.
- [ ] Có index DB & tuning cơ bản để hệ thống chạy mượt với vài nghìn freebies.
- [ ] Có logging/metrics tối thiểu cho ingestion, analyzer, execution.
- [ ] Bạn thực sự dùng CLV một thời gian và đã điều chỉnh scoring/policy ít nhất một lần dựa trên feedback thật.

Sau Phase 10, CLV trở thành một **nền tảng cá nhân hoá săn freebies/voucher đa lĩnh vực** với kiến trúc rõ ràng, dễ mở rộng, và có vòng lặp cải tiến liên tục.
