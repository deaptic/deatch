export type Anchor = Pick<DOMRect, "left" | "right" | "top" | "height">;
export type Size = { width: number; height: number };

const GAP = 8;

/** Beside the anchor, right if it fits, else left; centred on it vertically. */
export function zoomPlacement(
  anchor: Anchor,
  size: Size,
  viewport: Size,
): { x: number; y: number } {
  const fitsRight = anchor.right + GAP + size.width <= viewport.width - GAP;
  const x = fitsRight
    ? anchor.right + GAP
    : Math.max(GAP, anchor.left - GAP - size.width);
  const centred = anchor.top + anchor.height / 2 - size.height / 2;
  const y = Math.max(
    GAP,
    Math.min(centred, viewport.height - GAP - size.height),
  );
  return { x, y };
}
