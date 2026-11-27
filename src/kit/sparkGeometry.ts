export const SPARK_WIDTH = 100;
export const SPARK_HEIGHT = 32;
const INSET = 4;

export type SparkPoint = { x: number; y: number };

export function sparkPoints(values: readonly number[]): SparkPoint[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const last = Math.max(1, values.length - 1);
  return values.map((value, i) => ({
    x: (i / last) * SPARK_WIDTH,
    y: INSET + (1 - (value - min) / span) * (SPARK_HEIGHT - INSET * 2),
  }));
}

export function nearestIndex(count: number, fraction: number): number {
  const clamped = Math.min(1, Math.max(0, fraction));
  return Math.round(clamped * Math.max(0, count - 1));
}
