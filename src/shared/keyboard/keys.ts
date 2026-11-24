import { type MessageKey, t } from "../i18n/index.ts";

export const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

const KEY_LABELS: Record<string, MessageKey> = {
  ctrl: "KEY_CTRL_LABEL",
  alt: "KEY_ALT_LABEL",
  shift: "KEY_SHIFT_LABEL",
  meta: "KEY_META_LABEL",
  up: "KEY_UP_LABEL",
  down: "KEY_DOWN_LABEL",
  left: "KEY_LEFT_LABEL",
  right: "KEY_RIGHT_LABEL",
  enter: "KEY_ENTER_LABEL",
  escape: "KEY_ESCAPE_LABEL",
  tab: "KEY_TAB_LABEL",
  delete: "KEY_DELETE_LABEL",
  pageup: "KEY_PAGE_UP_LABEL",
  pagedown: "KEY_PAGE_DOWN_LABEL",
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
