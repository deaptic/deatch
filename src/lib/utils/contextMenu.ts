/// Opens a menu at the pointer and keeps the right click from reaching the
/// row behind it. Without a menu the click passes on untouched.
export function openMenuAt(
  e: MouseEvent,
  open: ((x: number, y: number) => void) | undefined,
): void {
  if (!open) return;
  e.preventDefault();
  e.stopPropagation();
  open(e.clientX, e.clientY);
}
