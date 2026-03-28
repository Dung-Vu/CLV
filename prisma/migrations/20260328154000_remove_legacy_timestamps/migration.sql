ALTER TABLE "ClaimLog"
DROP COLUMN IF EXISTS "executedAt";

DROP INDEX IF EXISTS "AgentRunLog_runAt_idx";

ALTER TABLE "AgentRunLog"
DROP COLUMN IF EXISTS "runAt";

CREATE INDEX IF NOT EXISTS "AgentRunLog_startedAt_idx"
ON "AgentRunLog"("startedAt");