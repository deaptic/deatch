import { prefs, setPrefs } from "./core.ts";
import { MIN_TRIGGER_COOLDOWN, type Trigger } from "./schema.ts";

export const triggers = () => prefs.triggers;

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
    response: "",
  };
}

export function saveTrigger(trigger: Trigger) {
  const value = { ...trigger };
  if (prefs.triggers.some((t) => t.id === trigger.id)) {
    setPrefs("triggers", (t) => t.id === trigger.id, value);
  } else {
    setPrefs("triggers", (t) => [...t, value]);
  }
}

export function removeTrigger(id: string) {
  setPrefs("triggers", (t) => t.filter((x) => x.id !== id));
}
