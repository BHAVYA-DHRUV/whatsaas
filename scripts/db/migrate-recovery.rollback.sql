-- Rollback ONLY the recovery FK/column if you must revert gateway_id re-add.
-- Does NOT remove onboarding_completed_at (data would be lost semantically).

BEGIN;

ALTER TABLE "plans" DROP CONSTRAINT IF EXISTS "plans_gateway_id_payment_gateways_id_fk";
-- Optional: ALTER TABLE "plans" DROP COLUMN IF EXISTS "gateway_id";

COMMIT;
