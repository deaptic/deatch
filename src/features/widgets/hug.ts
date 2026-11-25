type Edges = { left: number; right: number };

export function hugWidth(
  lines: readonly Edges[],
  tileLeft: number,
  zoom: number,
  trailing: number,
): number | null {
  if (lines.length === 0 || zoom <= 0) return null;
  const right = Math.max(...lines.map((line) => line.right));
  return Math.ceil((right - tileLeft) / zoom + trailing);
}

function drawnEdges(tile: HTMLElement): Edges[] {
  const edges: Edges[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(tile, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    edges.push(...range.getClientRects());
  }
  for (const image of tile.querySelectorAll("img")) {
    const box = image.getBoundingClientRect();
    const margin = parseFloat(getComputedStyle(image).marginRight);
    const zoom = image.offsetWidth ? box.width / image.offsetWidth : 1;
    edges.push({ left: box.left, right: box.right + margin * zoom });
  }
  return edges;
}

function hug(tile: HTMLElement) {
  tile.style.width = "";
  const box = tile.getBoundingClientRect();
  if (tile.offsetWidth === 0) return;
  const style = getComputedStyle(tile);
  const width = hugWidth(
    drawnEdges(tile),
    box.left,
    box.width / tile.offsetWidth,
    parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth),
  );
  if (width !== null && width < tile.offsetWidth) {
    tile.style.width = `${width}px`;
  }
}

export function hugTiles(container: HTMLElement): void {
  for (const tile of container.querySelectorAll<HTMLElement>(
    ":not([data-leaving]) > [data-item-id]",
  )) {
    hug(tile);
  }
}

export function clearHugs(container: HTMLElement): void {
  for (const tile of container.querySelectorAll<HTMLElement>(
    "[data-item-id]",
  )) {
    tile.style.width = "";
  }
}
