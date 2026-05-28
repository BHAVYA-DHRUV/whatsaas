# AI agent configuration

## Per-tenant setup

1. Settings → AI Agent
2. Provider: OpenAI (or Gemini if configured)
3. Model: `gpt-4o-mini` (cost-effective) or `gpt-4o`
4. Paste API key (isolated per `ai_configs.teamId`)
5. System prompt: use default from seed or customize
6. Enable agent + set max output tokens (quota control)

## Default prompt (seeded)

Professional WhatsApp sales/support assistant — collect requirements, route leads, human handoff, multilingual, no system leakage.

## Human handoff

- User messages containing `agent`, `support`, `human` trigger automation **Human Handoff** flow
- Pause AI on chat: toggle in chat header
- Assign agent via CRM / chat assignment

## Cost & quotas

- Enforce `maxOutputTokens` per config
- Enterprise plan: `isAiEnabled` on plan row
- Track usage via `execution_logs` (`source = ai`)

## Production requirements

- Set `OPENAI_API_KEY` in `.env` as fallback only; prefer tenant keys
- Monitor OpenAI rate limits; implement retry in `lib/plugins/ai-chat/service.ts`
