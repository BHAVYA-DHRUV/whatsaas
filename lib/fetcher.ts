import { fetchWithResilience, type RequestOptions } from '@/lib/api/api-resilience';

/** SWR fetcher — always sends session cookies on same-origin API calls with resilience. */
export async function apiFetcher<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
  try {
    const res = await fetchWithResilience(url, {
      ...options,
      credentials: 'include',
      timeout: options?.timeout || 10000,
    });
    if (!res.ok) {
      const err = new Error(`API ${res.status}: ${url}`);
      (err as Error & { status: number }).status = res.status;
      throw err;
    }
    return res.json() as Promise<T>;
  } catch (error: any) {
    console.error(`[apiFetcher] Failed to fetch ${url}:`, error.message);
    throw error;
  }
}
