export const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

export function comboFor(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");
  parts.push(e.key.toLowerCase().replace(/^arrow/, ""));
  return parts.join("-");
}
