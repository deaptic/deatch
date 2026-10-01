export const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

const KEY_LABELS: Record<string, string> = {
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  meta: "Win",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  enter: "Enter",
  escape: "Esc",
  tab: "Tab",
};

export function keyLabels(combo: string): string[] {
  return combo
    .split("-")
    .map((k) => KEY_LABELS[k] ?? (k.length === 1 ? k.toUpperCase() : k));
}

export function comboFor(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");
  parts.push(e.key.toLowerCase().replace(/^arrow/, ""));
  return parts.join("-");
}
