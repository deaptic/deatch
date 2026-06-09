export function formatViewers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function formatUptime(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - start) / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}
