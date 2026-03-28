import type { Freebie } from '@prisma/client';
import type { ExecutionPlan, ExecutionStep } from './execution.types';

const SECONDS_PER_STEP = 15;

function parseSteps(stepsJson: string | null): ExecutionStep[] {
  if (!stepsJson) return [];
  try {
    const parsed: unknown = JSON.parse(stepsJson);
    if (!Array.isArray(parsed)) {
      throw new Error('stepsJson must be a JSON array');
    }
    return parsed as ExecutionStep[];
  } catch (err) {
    throw new Error(
      `Invalid stepsJson: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function buildExecutionPlan(freebie: Freebie): ExecutionPlan {
  if (freebie.tier !== 'A') {
    throw new Error(
      `Execution only allowed for Tier A freebies — got Tier ${freebie.tier ?? 'null'} (id: ${freebie.id})`,
    );
  }

  if (freebie.cardRequired) {
    throw new Error(
      `Execution blocked — freebie requires a credit card (id: ${freebie.id})`,
    );
  }

  const steps = parseSteps(freebie.stepsJson);

  const requiresManualReview = steps.length > 5 || freebie.kycRequired;

  return {
    freebieId: freebie.id,
    freebieTitle: freebie.title,
    url: freebie.url,
    steps,
    estimatedDuration: steps.length * SECONDS_PER_STEP,
    requiresManualReview,
    createdAt: new Date(),
  };
}
