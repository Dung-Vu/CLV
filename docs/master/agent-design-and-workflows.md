# Agent Design & Workflows

> Tài liệu này mô tả chi tiết các agent trong CLV, vai trò, inputs/outputs, và workflows mà chúng thực hiện.

---

## 1. Danh sách agent & vai trò

- Liệt kê tất cả agent hiện có:
  - SupervisorAgent
  - ResearchAgent
  - ExecutionAgent
  - (Optional) MemoryAgent / AnalyticsAgent
- Với mỗi agent: 1–2 câu mô tả vai trò.

---

## 2. Interface chung & context

- Nhắc lại interface `Agent`, `AgentContext`, `AgentResult`.
- Mô tả các nguồn dữ liệu chính mà agent có thể truy cập (DB, logger, config, v.v.).

---

## 3. Workflows chi tiết cho từng agent

### 3.1. SupervisorAgent

- Flow chạy định kỳ (vd: mỗi ngày):
  - Đọc thống kê hệ thống.
  - Đưa ra quyết định adjust (log lại, có thể update config nhẹ).
- Nêu rõ: hiện tại chỉ log, không auto chỉnh config (tránh quá phức tạp).

### 3.2. ResearchAgent

- Flow định kỳ (vd: mỗi tuần):
  - Kiểm tra `SOURCES` & `docs/sources.md`.
  - Đề xuất source mới hoặc enable/disable source.
- Mô tả thêm các ý tưởng tương lai (LLM đọc blog để tìm source mới).

### 3.3. ExecutionAgent

- Flow thường xuyên (vd: mỗi giờ):
  - Chạy ingestion nếu cần.
  - Chạy analyzer cho items còn `raw`.
  - Chạy scoring cho items cần rescore.
  - Xem auto candidates và (option) đề xuất execution.

---

## 4. Multi-step workflows (kết hợp nhiều agent)

- Mô tả 1–2 kịch bản lớn, ví dụ:
  - "Ngày mới" workflow: ResearchAgent chạy → ExecutionAgent ingest/analyze/rescore → bạn review trên dashboard → (optional) ExecutionAgent thực thi semi-auto.
- Có thể dùng sequence diagram hoặc bullet flow.

---

## 5. Tương lai: tích hợp framework multi-agent

- Ghi lại ý tưởng nếu sau này bạn muốn chuyển sang dùng framework agentic (LangGraph, v.v.):
  - Agent CLV mapping sang node/graph như thế nào.
  - Phần nào giữ nguyên (business logic), phần nào bị thay thế (orchestration).

---

## 6. Định hướng mở rộng

- Gợi ý thêm các agent tiềm năng:
  - AlertAgent – theo dõi metric & gửi cảnh báo.
  - CleanupAgent – dọn dữ liệu cũ.
  - PersonalizationAgent – học từ hành vi claim của bạn để adjust scoring.
