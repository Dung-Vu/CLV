export type ExecutionMode = 'dry_run' | 'semi_auto';

export interface ExecutionContext {
  freebieId: string;
  url: string;
  mode: ExecutionMode;
  /** Registration email — loaded from env.CLAIM_EMAIL */
  email: string;
  /** Max milliseconds per step before aborting */
  stepTimeoutMs?: number;
}

export interface ExecutionResult {
  success: boolean;
  error?: string;
  /** Human-readable log of each step attempted */
  stepsLog: string[];
}

/** Minimal shape of a Freebie needed by execution layer */
export interface FreebieForExecution {
  id: string;
  title: string;
  url: string;
  tier: string | null;
  score: number;
  cardRequired: boolean;
  kycRequired: boolean;
  eligibleVn: boolean;
  riskLevel: string;
  frictionLevel: string;
  status: string;
}
