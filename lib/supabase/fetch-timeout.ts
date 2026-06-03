const DEFAULT_TIMEOUT_MS = 6000;

export async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const timeoutMs = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Supabase request timed out after ${timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
