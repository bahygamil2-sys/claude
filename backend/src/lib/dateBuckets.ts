/** Buckets timestamps into UTC-day counts, sorted ascending — the shape every "X over time" chart needs. */
export function bucketByDay(dates: Date[]): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const day = date.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}
