export type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

function comboFor(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  parts.push(e.key);
  return parts.join("+");
}

export function registerShortcuts(map: ShortcutMap): () => void {
  function onKeyDown(e: KeyboardEvent) {
    const fn = map[comboFor(e)];
    if (!fn) return;
    e.preventDefault();
    fn(e);
  }
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}
