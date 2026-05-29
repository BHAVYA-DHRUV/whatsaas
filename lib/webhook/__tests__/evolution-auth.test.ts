import { describe, it, expect, afterEach } from 'vitest';
import { verifyEvolutionWebhook } from '../evolution-auth';

describe('verifyEvolutionWebhook', () => {
  const originalToken = process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN;
  const originalAuth = process.env.AUTHENTICATION_API_KEY;
  const originalEvolutionApiKey = process.env.EVOLUTION_API_KEY;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalToken === undefined) delete process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN;
    else process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN = originalToken;

    if (originalAuth === undefined) delete process.env.AUTHENTICATION_API_KEY;
    else process.env.AUTHENTICATION_API_KEY = originalAuth;

    if (originalEvolutionApiKey === undefined) delete process.env.EVOLUTION_API_KEY;
    else process.env.EVOLUTION_API_KEY = originalEvolutionApiKey;

    const envRecord = process.env as Record<string, string | undefined>;
    if (originalNodeEnv === undefined) delete envRecord.NODE_ENV;
    else envRecord.NODE_ENV = originalNodeEnv;
  });

  it('accepts a token value even when the header has surrounding whitespace', async () => {
    process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN = ' shared-secret ';
    delete process.env.AUTHENTICATION_API_KEY;

    const request = new Request('http://localhost/api/webhook/evolution', {
      headers: { apikey: ' shared-secret ' },
    });

    await expect(verifyEvolutionWebhook(request)).resolves.toBe(true);
  });

  it('accepts bearer auth when the configured token is provided in another env var', async () => {
    delete process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN;
    process.env.AUTHENTICATION_API_KEY = 'alt-secret';

    const request = new Request('http://localhost/api/webhook/evolution', {
      headers: { authorization: 'Bearer alt-secret' },
    });

    await expect(verifyEvolutionWebhook(request)).resolves.toBe(true);
  });

  it('accepts the Evolution API key alias used by the webhook client', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    Object.assign(process.env, { NODE_ENV: 'production' });
    delete process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN;
    delete process.env.EVOLUTION_WEBHOOK_TOKEN;
    delete process.env.AUTHENTICATION_API_KEY;
    process.env.EVOLUTION_API_KEY = 'evo-secret';

    const request = new Request('http://localhost/api/webhook/evolution', {
      headers: { apikey: 'evo-secret' },
    });

    await expect(verifyEvolutionWebhook(request)).resolves.toBe(true);

    const envRecord = process.env as Record<string, string | undefined>;
    if (previousNodeEnv === undefined) delete envRecord.NODE_ENV;
    else envRecord.NODE_ENV = previousNodeEnv;
  });

  it('accepts the apikey value sent inside the webhook body', async () => {
    delete process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN;
    delete process.env.EVOLUTION_WEBHOOK_TOKEN;
    delete process.env.AUTHENTICATION_API_KEY;
    process.env.EVOLUTION_API_KEY = 'body-secret';

    const request = new Request('http://localhost/api/webhook/evolution', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ apikey: 'body-secret' }),
    });

    await expect(verifyEvolutionWebhook(request)).resolves.toBe(true);
  });
});
