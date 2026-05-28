/** SWR fetcher — always sends session cookies on same-origin API calls. */
export async function apiFetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const err = new Error(`API ${res.status}: ${url}`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}
