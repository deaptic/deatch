/// The rows to render, `start` inclusive to `end` exclusive, and the space
/// the rows outside it would take above and below.
export type FeedWindow = {
  start: number;
  end: number;
  before: number;
  after: number;
};

function sum(heights: readonly number[], from: number, to: number): number {
  let total = 0;
  for (let i = from; i < to; i++) total += heights[i] ?? 0;
  return total;
}

/// The rows overlapping the band from `top` to `bottom`, in list pixels.
export function windowAt(
  heights: readonly number[],
  top: number,
  bottom: number,
): FeedWindow {
  let start = 0;
  let offset = 0;
  while (start < heights.length && offset + (heights[start] ?? 0) <= top) {
    offset += heights[start] ?? 0;
    start++;
  }
  const before = offset;
  let end = start;
  while (end < heights.length && offset < bottom) {
    offset += heights[end] ?? 0;
    end++;
  }
  return { start, end, before, after: sum(heights, end, heights.length) };
}

/// The newest rows that fill `span` pixels, for a feed pinned to its end.
export function windowFromEnd(
  heights: readonly number[],
  span: number,
): FeedWindow {
  let start = heights.length;
  let filled = 0;
  while (start > 0 && filled < span) {
    start--;
    filled += heights[start] ?? 0;
  }
  return {
    start,
    end: heights.length,
    before: sum(heights, 0, start),
    after: 0,
  };
}

/// Where row `index` starts, in list pixels.
export function offsetOf(heights: readonly number[], index: number): number {
  return sum(heights, 0, index);
}
