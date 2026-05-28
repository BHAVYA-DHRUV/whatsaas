/**
 * Validates Evolution API webhook requests.
 * Evolution may send apikey header matching AUTHENTICATION_API_KEY or NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN.
 */
export function verifyEvolutionWebhook(request: Request): boolean {
  const expected =
    process.env.NEXT_PUBLIC_EVOLUTION_WEBHOOK_TOKEN ||
    process.env.EVOLUTION_WEBHOOK_TOKEN ||
    process.env.AUTHENTICATION_API_KEY;

  if (!expected) {
    // Dev: allow when not configured (log warning in route)
    return process.env.NODE_ENV !== 'production';
  }

  const apikey = request.headers.get('apikey') || request.headers.get('x-api-key');
  if (apikey === expected) return true;

  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${expected}`) return true;

  return false;
}
