// Fail fast instead of awaiting forever when an upstream (e.g. Supabase Auth)
// is unresponsive. Rejects with "timeout" after `ms`.
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}
