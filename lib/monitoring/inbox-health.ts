/**
 * Production monitoring for Inbox data integrity
 * Logs structured errors for debugging API, cache, and socket issues
 */

export interface InboxHealthLog {
  timestamp?: string;
  workspaceId?: number;
  instanceId?: number;
  userId?: number;
  teamId?: number;
  eventName?: string;
  payloadShape: string;
  errorType: 'invalid_api_response' | 'invalid_cache_payload' | 'invalid_socket_payload' | 'schema_mismatch';
  details: unknown;
}

/**
 * Log inbox health issues to console with structured format
 * In production, this could send to monitoring service (Sentry, DataDog, etc.)
 */
export function logInboxHealthIssue(issue: InboxHealthLog) {
  const logEntry = {
    ...issue,
    timestamp: issue.timestamp || new Date().toISOString(),
  };

  // Console with structured format for easy parsing
  console.error('[INBOX_HEALTH]', JSON.stringify(logEntry));

  // In production, send to monitoring service
  // Example: Sentry.captureMessage('Inbox data integrity issue', { extra: logEntry });
}

/**
 * Helper to log API response validation failures
 */
export function logInvalidApiResponse(
  endpoint: string,
  receivedType: string,
  data: unknown,
  context?: { workspaceId?: number; userId?: number; teamId?: number }
) {
  logInboxHealthIssue({
    errorType: 'invalid_api_response',
    eventName: endpoint,
    payloadShape: receivedType,
    details: {
      endpoint,
      receivedType,
      dataSample: Array.isArray(data) ? `Array(${data.length})` : typeof data,
      context,
    },
  });
}

/**
 * Helper to log cache payload validation failures
 */
export function logInvalidCachePayload(
  cacheKey: string,
  receivedType: string,
  data: unknown,
  context?: { workspaceId?: number; teamId?: number; userId?: number }
) {
  logInboxHealthIssue({
    errorType: 'invalid_cache_payload',
    payloadShape: receivedType,
    details: {
      cacheKey,
      receivedType,
      dataSample: Array.isArray(data) ? `Array(${data.length})` : typeof data,
      context,
    },
  });
}

/**
 * Helper to log socket payload validation failures
 */
export function logInvalidSocketPayload(
  eventName: string,
  payload: unknown,
  context?: { teamId?: number; userId?: number; workspaceId?: number }
) {
  logInboxHealthIssue({
    errorType: 'invalid_socket_payload',
    eventName,
    payloadShape: typeof payload,
    details: {
      eventName,
      payload,
      context,
    },
  });
}

/**
 * Helper to log conversation schema mismatches
 */
export function logSchemaMismatch(
  location: string,
  field: string,
  expectedType: string,
  receivedType: string,
  context?: { workspaceId?: number; teamId?: number }
) {
  logInboxHealthIssue({
    errorType: 'schema_mismatch',
    payloadShape: 'schema_validation',
    details: {
      location,
      field,
      expectedType,
      receivedType,
      context,
    },
  });
}
