# Schema audit (live DB)

Generated: 2026-05-26T11:49:04.652Z

## Critical issues
- None

## Verified
- table: users
- table: plans
- table: payment_gateways
- table: teams
- table: team_members
- table: chats
- table: messages
- table: contacts
- table: evolution_instances
- table: automations
- table: ai_configs
- table: ai_tools
- table: ai_sessions
- table: webhook_events
- table: call_credits
- table: twilio_configs
- column: plans.gateway_id
- column: teams.onboarding_completed_at
- column: teams.gateway_type
- column: teams.gateway_customer_id
- column: teams.gateway_subscription_id


## Applied migrations (drizzle)
- 4a2bdac2b9b6b1060935fc3112f3d3ca3d4a75d7279c4e69c24390d73e37bd54 @ 1776126162795
- 41dd99d2fdc1e060e1dfbca34984423b23cd12db29b5c62b7461bf106e5e8b53 @ 1779269396724
- 74f3c196d938420434e36f5014dbf09b50648a15a8e73616b7fbb9e5c3a71935 @ 1779300000000
- 067e95d1b1c4919e2b895b11606b470b8fbd281eefe2be3d711894356eeb29a3 @ 1779682651487

## Recovery
Run: `npx tsx scripts/apply-recovery.ts` or `psql -f scripts/db/migrate-recovery.sql`
