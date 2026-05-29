/**
 * Validates Evolution API webhook requests.
 * Evolution may send apikey / x-api-key / authorization headers.
 */
function normalizeToken(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim();
}

async function getBodyToken(request: Request): Promise<string | null> {
  try {
    const body = await request.clone().json();
    const candidates = [
      body?.apikey,
      body?.apiKey,
      body?.token,
      body?.secret,
      body?.webhookToken,
      body?.authorization,
    ];

    return normalizeToken(candidates.find((value): value is string => typeof value === 'string'));
  } catch {
    return null;
  }
}

export async function verifyEvolutionWebhook(request: Request): Promise<boolean> {
  const expectedTokens = [
    process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN,
    process.env.EVOLUTION_WEBHOOK_TOKEN,
    process.env.EVOLUTION_WEBHOOK_SECRET,
    process.env.EVOLUTION_API_KEY,
    process.env.AUTHENTICATION_API_KEY,
  ]
    .map(normalizeToken)
    .filter((token): token is string => Boolean(token));

  if (expectedTokens.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }

  const apikey = normalizeToken(request.headers.get('apikey') || request.headers.get('x-api-key'));
  if (apikey && expectedTokens.includes(apikey)) return true;

  const auth = normalizeToken(request.headers.get('authorization'));
  if (auth && expectedTokens.some((token) => auth === `Bearer ${token}`)) return true;

  const bodyToken = await getBodyToken(request);
  if (bodyToken && expectedTokens.includes(bodyToken)) return true;

  return false;
}
