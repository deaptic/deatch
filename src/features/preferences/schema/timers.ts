import { choice, custom, object, type Value } from "./fields.ts";

export const TIMER_MINUTES = [5, 10, 15, 30, 60] as const;
export const TIMER_ACTIVITY = [0, 10, 25, 50, 100] as const;

export type Timer = {
  id: string;
  enabled: boolean;
  name: string;
  message: string;
  minutes: number;
  minMessages: number;
};

function timer(item: unknown): Timer[] {
  if (!item || typeof item !== "object") return [];
  const t = item as Partial<Timer>;
  if (typeof t.id !== "string") return [];
  return [
    {
      id: t.id,
      enabled: t.enabled !== false,
      name: typeof t.name === "string" ? t.name : "",
      message: typeof t.message === "string" ? t.message : "",
      minutes: choice(TIMER_MINUTES, 15).read(t.minutes),
      minMessages: choice(TIMER_ACTIVITY, 25).read(t.minMessages),
    },
  ];
}

export const TIMERS = object({
  list: custom<Timer[]>(
    () => [],
    (raw) => (Array.isArray(raw) ? raw.flatMap(timer) : []),
  ),
});

export type TimerPreferences = Value<typeof TIMERS>;
