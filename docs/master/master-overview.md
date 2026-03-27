# CLV Master Overview

> Tài liệu này tổng hợp bức tranh toàn cảnh của CLV ở trạng thái "master": mục tiêu, khả năng hiện tại, kiến trúc, và cách sử dụng.

---

## 1. Mục tiêu & use case chính

- Mô tả ngắn gọn CLV làm gì cho **1 user cá nhân ở Việt Nam**.
- Liệt kê 3–5 **use case điển hình** (vd: săn free AI tools, SaaS trials, cloud credits, voucher VN…).
- Ghi rõ **giới hạn** (không phải sản phẩm thương mại, không bảo đảm 100% uptime, v.v.).

---

## 2. Chức năng ở trạng thái master

- Mô tả từng chức năng chính, mapping với các phase:
  - Ingestion (Phase 4).
  - Analyzer (Phase 5).
  - Scoring & Policy (Phase 7).
  - Semi-auto Execution (Phase 8).
  - Multi-agent orchestration (Phase 9).
- Mỗi chức năng: 2–3 dòng về **input → process → output**.

---

## 3. Kiến trúc cấp cao

- Nhúng/nhắc lại sơ đồ khối toàn hệ thống (có thể tái sử dụng từ `long-term-strategy.md`).
- Mô tả các layer: UI, API, Modules (ingestion/analyzer/scoring/execution/agents), DB.

---

## 4. Hướng dẫn đọc các tài liệu master khác

- Giới thiệu ngắn:
  - `system-architecture-deep-dive.md` – chi tiết kỹ thuật.
  - `agent-design-and-workflows.md` – các agent & luồng công việc.
  - `operations-runbook.md` – vận hành & xử lý sự cố.
  - `security-privacy-compliance.md` – bảo mật & riêng tư.
  - `extension-experiment-playbook.md` – cách mở rộng & thử nghiệm.

---

## 5. Trạng thái triển khai

- Mô tả version hiện tại (vd: v1.0.0) và những phần nào đã hoàn tất / vẫn đang WIP.
- Liệt kê các phase đã xong và phase còn lại (nếu có).
