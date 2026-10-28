import { type MessageKey, t } from "../i18n/index.ts";

export const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

const KEY_LABELS: Record<string, MessageKey> = {
  ctrl: "KEY_CTRL",
  alt: "KEY_ALT",
  shift: "KEY_SHIFT",
  meta: "KEY_META",
  up: "KEY_UP",
  down: "KEY_DOWN",
  left: "KEY_LEFT",
  right: "KEY_RIGHT",
  enter: "KEY_ENTER",
  escape: "KEY_ESCAPE",
  tab: "KEY_TAB",
  pageup: "KEY_PAGE_UP",
  pagedown: "KEY_PAGE_DOWN",
};

export function keyLabels(combo: string): string[] {
  return combo.split(/-(?!$)/).map((k) => {
    const label = KEY_LABELS[k];
    if (label) return t(label);
    return k.length === 1 ? k.toUpperCase() : k;
  });
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
