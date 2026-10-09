export function formatViewers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${pad(m)}:${pad(s)}`;
}

export function formatUptime(startedAt: string, now: number): string {
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return "";
  return formatDuration(now - start);
}
