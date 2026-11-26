import type { Life } from "../../shared/life.ts";
import { asRecord, type Loose, parseJson } from "../../shared/record.ts";

type Handler = (message: Loose) => void;

function messageOf(event: Event): Loose | null {
  if (!(event instanceof CustomEvent) || typeof event.detail !== "string") {
    return null;
  }
  return asRecord(parseJson(event.detail));
}

export function createPubsub(life: Life) {
  const handlers = new Map<string, Handler[]>();
  let target: EventTarget | null = null;

  function dispatch(event: Event) {
    const message = messageOf(event);
    if (!message || typeof message.type !== "string") return;
    for (const handler of handlers.get(message.type) ?? []) handler(message);
  }

  function attach() {
    const events: unknown = asRecord(window).__twitch_pubsub_events;
    if (!(events instanceof EventTarget) || events === target) return;
    target = events;
    life.listen(events, "notification", dispatch);
  }

  function on(type: string, handler: Handler) {
    handlers.set(type, [...(handlers.get(type) ?? []), handler]);
  }

  return { attach, on };
}
