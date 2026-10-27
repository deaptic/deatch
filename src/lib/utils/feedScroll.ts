export type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

// Absorbs sub-pixel scroll offsets; growth while following is caught by the
// feed's resize observer, so no more is needed.
const BOTTOM_SLACK_PX = 2;

export function isAtBottom(m: ScrollMetrics): boolean {
  return m.scrollHeight - m.scrollTop - m.clientHeight < BOTTOM_SLACK_PX;
}

export function maxScrollTop(m: ScrollMetrics): number {
  return Math.max(0, m.scrollHeight - m.clientHeight);
}

export function centeredScrollTop(
  m: ScrollMetrics,
  itemTop: number,
  itemHeight: number,
): number {
  const wanted = itemTop + itemHeight / 2 - m.clientHeight / 2;
  return Math.min(maxScrollTop(m), Math.max(0, wanted));
}
