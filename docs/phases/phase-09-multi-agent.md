# Phase 9 — Multi-agent CLV (Supervisor, Research, Execution)

> Mục tiêu: tách rõ các vai trò logic trong hệ thống thành các "agent" (Supervisor, Research, Execution, Memory) ở cấp code, có thể chạy độc lập theo lịch hoặc theo sự kiện, và phối hợp với nhau thông qua hàng đợi / scheduler đơn giản.

> Lưu ý: ở giai đoạn này chưa nhất thiết phải dùng framework multi-agent phức tạp; chỉ cần thiết kế kiến trúc theo phong cách agentic, để sau này nếu muốn gắn framework (LangGraph, v.v.) thì vẫn phù hợp.

---

## 1. Mục tiêu kỹ thuật của Phase 9

- Định nghĩa **interface chung cho agent** trong CLV.
- Implement tối thiểu 3 agent:
  - **SupervisorAgent** – điều phối, lên lịch, tổng hợp.
  - **ResearchAgent** – tìm & đề xuất nguồn mới, hoặc rescan theo chiến lược.
  - **ExecutionAgent** – giám sát và kích hoạt ingestion/analyzer/execution theo policy.
- Thiết lập **scheduler** đơn giản (cron/job runner) để chạy agent tuần tự.

---

## 2. Interface & kiến trúc agent

### 2.1. Interface Agent

Tạo `src/modules/agents/agent.types.ts`:

```ts
export type AgentContext = {
  now: Date;
  // có thể thêm logger, config, v.v.
};

export interface AgentResult {
  name: string;
  actions: string[]; // log các hành động / quyết định
}

export interface Agent {
  name: string;
  run(ctx: AgentContext): Promise<AgentResult>;
}
```

### 2.2. Các agent cụ thể

Cấu trúc:

```text
src/modules/agents/
  agent.types.ts
  supervisor.agent.ts
  research.agent.ts
  execution.agent.ts
  memory.agent.ts   # optional / future
  agent.runner.ts
```

---

## 3. Vai trò từng agent

### 3.1. SupervisorAgent

- Đọc các thống kê tổng (từ DB):
  - Số freebie mới hôm nay, số đã phân tích, số đã claim.
  - Giá trị ước tính claim được.
- Dựa vào đó, quyết định:
  - Có cần tăng/giảm tần suất ingestion / analyzer không.
  - Có cần ưu tiên category cụ thể (vd: AI tools > SaaS nhỏ).
- Ghi log lại dưới dạng `AgentResult.actions`.

Implementation skeleton (pseudocode) trong `supervisor.agent.ts`.

### 3.2. ResearchAgent

- Nhiệm vụ hiện tại (MVP):
  - Kiểm tra `docs/sources.md` + `SOURCES` để xem nguồn nào đang disabled nhưng có thể enable.
  - Gợi ý thêm nguồn mới dựa trên pattern (vd: site mới được nhắc nhiều).
- Về lâu dài:
  - Có thể dùng LLM đọc blog/Reddit để đề xuất thêm feed mới.

Trong Phase 9, chỉ cần implement logic đơn giản sử dụng metadata có sẵn.

### 3.3. ExecutionAgent

- Đóng vai "orchestrator" cho 3 pipeline chính:
  - Ingestion → Analyzer → Scoring.
  - Chạy lại Analyzer/Scoring cho item lỗi.
  - Chọn & chạy semi-auto execution (Tier A) ở mức schedule.
- Có thể dùng các hàm đã có:
  - `runIngestionOnce`
  - `analyzePendingFreebies`
  - `rescoreAnalyzedFreebies`
  - `getAutoCandidates`

`ExecutionAgent.run()` chỉ quyết định hôm nay nên gọi chuỗi nào (dựa trên context/time), không chứa logic business chi tiết.

---

## 4. Agent runner & scheduling

### 4.1. Agent runner

Trong `agent.runner.ts`:

```ts
import { Agent, AgentContext } from './agent.types';
import { supervisorAgent } from './supervisor.agent';
import { researchAgent } from './research.agent';
import { executionAgent } from './execution.agent';

const AGENTS: Agent[] = [supervisorAgent, researchAgent, executionAgent];

export async function runAllAgents() {
  const ctx: AgentContext = { now: new Date() };
  for (const agent of AGENTS) {
    try {
      const result = await agent.run(ctx);
      console.log(`[${agent.name}]`, result.actions.join(' | '));
    } catch (e) {
      console.error(`[${agent.name}] error`, e);
    }
  }
}
```

### 4.2. Scheduler

- Script CLI: `scripts/run-agents.ts` gọi `runAllAgents()`.
- Sau này có thể dùng cron (Linux) để chạy:
  - 1 lần mỗi giờ.
  - Hoặc tách agent runner theo tần suất khác nhau.

---

## 5. Logging & quan sát

- Mỗi agent nên:
  - Ghi log ở mức text (console hoặc logger) + có thể lưu summary vào DB (bảng `AgentRunLog` nếu cần).
- Điều này giúp bạn xem lại agent đã làm gì, có hành vi bất thường không.

---

## 6. Tiêu chí hoàn thành Phase 9

Phase 9 được coi là xong khi:

- [ ] Có module `agents` với interface `Agent` và ít nhất 3 agent cụ thể (supervisor, research, execution).
- [ ] Có `runAllAgents()` và script CLI chạy tuần tự các agent không lỗi.
- [ ] Ít nhất 1–2 hành động thực tế được thực thi thông qua ExecutionAgent (vd: gọi ingestion/analyzer/rescore).

Sau Phase 9, CLV có kiến trúc agentic rõ ràng: thay vì hàng loạt cron rời rạc, bạn có một "đội" agent với vai trò riêng, có thể nâng cấp dần (thêm LLM reasoning, memory…).
