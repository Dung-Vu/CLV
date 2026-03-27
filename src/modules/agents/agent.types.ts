export interface AgentContext {
  now: Date;
}

export interface AgentResult {
  name: string;
  /** Human-readable log of decisions / actions taken this run */
  actions: string[];
}

export interface Agent {
  name: string;
  run(ctx: AgentContext): Promise<AgentResult>;
}
