export function formatPx(value: number): string {
  return `${value}px`;
}

/// A setting kept as a whole percent, like a volume or a zoom.
export function formatWholePercent(value: number): string {
  return `${Math.round(value)}%`;
}
