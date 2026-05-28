-- Production-safe recovery: re-add plans.gateway_id if migration 0001 removed it.
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "gateway_id" integer;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plans_gateway_id_payment_gateways_id_fk'
  ) THEN
    ALTER TABLE "plans"
      ADD CONSTRAINT "plans_gateway_id_payment_gateways_id_fk"
      FOREIGN KEY ("gateway_id") REFERENCES "public"."payment_gateways"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
