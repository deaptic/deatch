export function openMenuAt(
  e: MouseEvent,
  open: ((x: number, y: number) => void) | undefined,
): void {
  if (!open) return;
  e.preventDefault();
  e.stopPropagation();
  open(e.clientX, e.clientY);
}
