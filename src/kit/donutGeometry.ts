export const DONUT_CIRCUMFERENCE = 100;
const GAP = 2;

export type DonutSegment = { offset: number; length: number };

export function donutSegments(values: readonly number[]): DonutSegment[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) return [];
  const gap = values.filter((value) => value > 0).length > 1 ? GAP : 0;
  let start = 0;
  return values.map((value) => {
    const share = (Math.max(0, value) / total) * DONUT_CIRCUMFERENCE;
    const segment = {
      offset: start + gap / 2,
      length: Math.max(0, share - gap),
    };
    start += share;
    return segment;
  });
}
