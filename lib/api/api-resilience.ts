/**
 * API Resilience Utilities
 * 
 * Provides retry logic, timeout handling, and graceful error recovery for API calls.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: any) => boolean;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: RetryOptions;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 300,
  maxDelay: 5000,
  backoffMultiplier: 2,
  retryableErrors: (error: any) => {
    // Retry on network errors, 5xx, 408, 429
    if (!error) return false;
    if (error.name === 'AbortError') return false;
    if (error.name === 'TypeError' && error.message.includes('fetch')) return true; // Network error
    if (error.status) {
      return error.status >= 500 || error.status === 408 || error.status === 429;
    }
    return false;
  },
};

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithResilience(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeout = 10000, retry = {}, ...fetchOptions } = options;
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retry };
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is retryable
      if (!response.ok && retryOptions.retryableErrors({ status: response.status })) {
        lastError = { status: response.status, message: response.statusText };
        if (attempt < retryOptions.maxRetries) {
          const delayTime = Math.min(
            retryOptions.initialDelay * Math.pow(retryOptions.backoffMultiplier, attempt),
            retryOptions.maxDelay
          );
          await delay(delayTime);
          continue;
        }
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if error is not retryable
      if (!retryOptions.retryableErrors(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === retryOptions.maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delayTime = Math.min(
        retryOptions.initialDelay * Math.pow(retryOptions.backoffMultiplier, attempt),
        retryOptions.maxDelay
      );
      await delay(delayTime);
    }
  }
  
  throw lastError;
}

export async function fetchJsonWithResilience<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetchWithResilience(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * SWR fetcher with resilience
 */
export function swrFetcherWithResilience(options?: RequestOptions) {
  return async (url: string) => {
    try {
      return await fetchJsonWithResilience(url, options);
    } catch (error: any) {
      console.error(`[SWR] Failed to fetch ${url}:`, error.message);
      // Return null or empty data instead of throwing to prevent UI crashes
      return null;
    }
  };
}
