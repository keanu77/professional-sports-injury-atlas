/** Best-effort edge-instance guard, not a global or fraud-proof quota.
 * Keys never enter D1; the next request in a new minute clears the old bucket.
 */
export function createRequestLimiter(maximum: number) {
  const buckets = new Map<string, number>();
  let minute = -1;
  return (ip: string, now = Date.now()) => {
    const current = Math.floor(now / 60000);
    if (current !== minute) {
      buckets.clear();
      minute = current;
    }
    if (!buckets.has(ip) && buckets.size >= 4096) return false;
    const count = (buckets.get(ip) ?? 0) + 1;
    buckets.set(ip, count);
    return count <= maximum;
  };
}
export const allowPopularRequest = createRequestLimiter(60);
