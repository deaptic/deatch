export type Anchor = Pick<DOMRect, "left" | "right" | "top" | "height">;
export type Viewport = { width: number; height: number };

const GAP = 8;

/** Beside the anchor, right if it fits, else left; centred on it vertically. */
export function zoomPlacement(
  anchor: Anchor,
  size: number,
  viewport: Viewport,
): { x: number; y: number } {
  const fitsRight = anchor.right + GAP + size <= viewport.width - GAP;
  const x = fitsRight
    ? anchor.right + GAP
    : Math.max(GAP, anchor.left - GAP - size);
  const centred = anchor.top + anchor.height / 2 - size / 2;
  const y = Math.max(GAP, Math.min(centred, viewport.height - GAP - size));
  return { x, y };
}
