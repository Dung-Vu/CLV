export type ExecutionMode = 'dry_run' | 'semi_auto';

export interface ExecutionStep {
  order: number;
  action: 'navigate' | 'click' | 'fill' | 'wait' | 'screenshot';
  selector?: string;
  value?: string;
  description: string;
}

export interface ExecutionPlan {
  freebieId: string;
  freebieTitle: string;
  url: string;
  steps: ExecutionStep[];
  estimatedDuration: number;
  requiresManualReview: boolean;
  createdAt: Date;
}

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

/** Result returned by execution.executor.ts — richer shape for plan-based execution */
export interface ExecutorResult {
  success: boolean;
  mode: 'dry_run' | 'real';
  stepsCompleted: number;
  totalSteps: number;
  evidencePaths: string[];
  error?: string;
  duration: number;
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
