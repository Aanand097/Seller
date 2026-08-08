/**
 * Retry helper for Supabase reads.
 *
 * The hosted database can go to sleep after a long period of inactivity.
 * The first request after that wakes it up but may fail or time out, which
 * previously made lists render as "empty". Retrying with backoff makes the
 * page recover on its own instead of showing no products.
 */
type SupabaseResult<T> = { data: T | null; error: { message: string } | null };

export async function withRetry<T>(
  fn: () => PromiseLike<SupabaseResult<T>>,
  attempts = 4,
): Promise<T | null> {
  let lastError: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const { data, error } = await fn();
      if (!error) return data;
      lastError = error;
    } catch (e) {
      lastError = e;
    }
    // 500ms, 900ms, 1700ms — enough for a sleeping backend to wake up.
    await new Promise((r) => setTimeout(r, 400 * 2 ** i + 100));
  }
  throw lastError instanceof Error ? lastError : new Error((lastError as any)?.message ?? "Database unavailable");
}
