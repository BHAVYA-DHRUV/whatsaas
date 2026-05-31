import 'server-only';

/** In-memory webhook event dedup with TTL (replay protection). */
const seen = new Map<string, number>();
const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 10_000;

function prune(now: number) {
  if (seen.size <= MAX_ENTRIES) return;
  for (const [key, ts] of seen) {
    if (now - ts > TTL_MS) seen.delete(key);
    if (seen.size <= MAX_ENTRIES * 0.8) break;
  }
}

export function buildWebhookEventKey(
  instanceName: string,
  event: string,
  messageId: string | null | undefined,
  remoteJid: string | null | undefined
): string {
  return `${instanceName}:${event}:${messageId ?? ''}:${remoteJid ?? ''}`;
}

/** Returns true if this event was already processed recently. */
export function isDuplicateWebhookEvent(key: string): boolean {
  const now = Date.now();
  prune(now);
  const prev = seen.get(key);
  if (prev && now - prev < TTL_MS) return true;
  seen.set(key, now);
  return false;
}

const authFailLog = new Map<string, number>();
const AUTH_LOG_INTERVAL_MS = 60_000;

/** Throttle repeated auth-failure logs per IP to prevent log spam. */
export function shouldLogWebhookAuthFailure(ip: string): boolean {
  const now = Date.now();
  const last = authFailLog.get(ip) ?? 0;
  if (now - last < AUTH_LOG_INTERVAL_MS) return false;
  authFailLog.set(ip, now);
  return true;
}
