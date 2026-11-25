import { prefs, setPrefs } from "./core.ts";
import { type ChatStyle, newChatStyle, type Widget } from "./schema/index.ts";

export const savedWidgets = () => prefs.widgets.list;

export function addWidget(): string {
  const id = crypto.randomUUID();
  const widget: Widget = { id, kind: "chat", style: newChatStyle() };
  setPrefs("widgets", "list", (list) => [...list, widget]);
  return id;
}

export function duplicateWidget(source: Widget): string {
  const id = crypto.randomUUID();
  setPrefs("widgets", "list", (list) => [
    ...list,
    { ...source, id, style: { ...source.style } },
  ]);
  return id;
}

export function updateWidgetStyle(id: string, change: Partial<ChatStyle>) {
  setPrefs("widgets", "list", (w) => w.id === id, "style", change);
}

export function removeWidget(id: string): void {
  setPrefs("widgets", "list", (list) => list.filter((w) => w.id !== id));
}
