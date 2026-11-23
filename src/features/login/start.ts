import * as events from "./events.ts";
import * as session from "./store.ts";

export function start(): () => void {
  const stops = [events.start(), session.start()];
  return () => {
    for (const stop of stops) stop();
  };
}
