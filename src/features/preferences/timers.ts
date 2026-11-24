import { prefs, setPrefs } from "./core.ts";
import type { Timer } from "./schema/index.ts";

export const savedTimers = () => prefs.timers.list;

export function addTimer(): string {
  const id = crypto.randomUUID();
  setPrefs("timers", "list", (list) => [
    ...list,
    {
      id,
      enabled: true,
      name: "",
      message: "",
      minutes: 15,
      minMessages: 25,
    },
  ]);
  return id;
}

export function updateTimer(id: string, change: Partial<Omit<Timer, "id">>) {
  setPrefs("timers", "list", (timer) => timer.id === id, change);
}

export function removeTimer(id: string): void {
  setPrefs("timers", "list", (list) => list.filter((t) => t.id !== id));
}
