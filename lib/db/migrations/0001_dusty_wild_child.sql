ALTER TABLE "plans" DROP CONSTRAINT "plans_gateway_id_payment_gateways_id_fk";
--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "gateway_id";