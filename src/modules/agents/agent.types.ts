export type AgentRunStatus = 'running' | 'success' | 'error' | 'skipped';

export interface AgentContext {
  now: Date;
  runType?: 'scheduled' | 'manual';
}

export interface AgentResult {
  name: string;
  /** Human-readable log of decisions / actions taken this run */
  actions: string[];
}

export interface Agent {
  name: string;
  /** When false the runner will skip this agent and log status='skipped' */
  enabled: boolean;
  run(ctx: AgentContext): Promise<AgentResult>;
}
