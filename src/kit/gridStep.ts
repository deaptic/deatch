const STEPS: Record<string, (columns: number) => number> = {
  ArrowLeft: () => -1,
  ArrowRight: () => 1,
  ArrowUp: (columns) => -columns,
  ArrowDown: (columns) => columns,
};

export function gridStep(
  index: number,
  key: string,
  columns: number,
  count: number,
): number | null {
  const offset = STEPS[key];
  if (!offset) return null;
  const next = index + offset(columns);
  return next >= 0 && next < count ? next : null;
}
