import { prefs, setPrefs } from "../../lib/stores/preferences/core.ts";
import {
  type BuiltInTrigger,
  MIN_TRIGGER_COOLDOWN,
  type Trigger,
} from "../../lib/stores/preferences/schema.ts";

export const customTriggers = () => prefs.triggers.custom;
export const builtInEnabled = (builtIn: BuiltInTrigger) =>
  prefs.triggers.builtIn[builtIn];

export function setBuiltInEnabled(builtIn: BuiltInTrigger, on: boolean) {
  setPrefs("triggers", "builtIn", builtIn, on);
}

export function blankTrigger(): Trigger {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    name: "",
    phrase: "",
    location: "start",
    caseSensitive: false,
    cooldown: MIN_TRIGGER_COOLDOWN,
    action: "reply",
    replies: [],
    otherwise: "",
    role: "everyone",
    count: 0,
  };
}

const settingsOf = ({ count: _count, ...settings }: Trigger) => settings;

export function sameTriggerSettings(a: Trigger, b: Trigger): boolean {
  return JSON.stringify(settingsOf(a)) === JSON.stringify(settingsOf(b));
}

export function saveTrigger(trigger: Trigger) {
  const stored = prefs.triggers.custom.find((t) => t.id === trigger.id);
  const value = { ...trigger, count: stored?.count ?? trigger.count };
  if (stored) {
    setPrefs("triggers", "custom", (t) => t.id === trigger.id, value);
  } else {
    setPrefs("triggers", "custom", (t) => [...t, value]);
  }
}

export function countReply(id: string) {
  setPrefs(
    "triggers",
    "custom",
    (t) => t.id === id,
    "count",
    (n) => n + 1,
  );
}

export function removeTrigger(id: string) {
  setPrefs("triggers", "custom", (t) => t.filter((x) => x.id !== id));
}
