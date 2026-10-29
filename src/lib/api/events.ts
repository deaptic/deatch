import { listen } from "@tauri-apps/api/event";
import { EVENTSUB_EVENT_NAMES, events } from "../bindings.ts";
import type { EventEnvelope, EventKind, Unlisten } from "../types/index.ts";
import { invokeCommand, type InvokeOptions, wrapUnlisten } from "./utils.ts";

type AppEvents = typeof events;
export type AppEventName = keyof AppEvents;
export type AppEventPayload<K extends AppEventName> = Parameters<
  Parameters<AppEvents[K]["listen"]>[0]
>[0]["payload"];

const commands = {
  onAppEvent: async <K extends AppEventName>(
    name: K,
    handler: (payload: AppEventPayload<K>) => void,
  ) => {
    // Each event's listen takes its own payload type; K picks exactly one.
    const listenTo = events[name].listen as (
      cb: (event: { payload: AppEventPayload<K> }) => void,
    ) => Promise<Unlisten>;
    return wrapUnlisten(await listenTo(({ payload }) => handler(payload)));
  },
  onEventSub: async <T>(
    kind: EventKind,
    handler: (envelope: EventEnvelope<T>) => void,
  ) =>
    wrapUnlisten(
      await listen<EventEnvelope<T>>(
        EVENTSUB_EVENT_NAMES[kind],
        ({ payload }) => handler(payload),
      ),
    ),
};

export function onAppEvent<K extends AppEventName>(
  name: K,
  handler: (payload: AppEventPayload<K>) => void,
  options?: InvokeOptions,
): Promise<Unlisten> {
  return invokeCommand(commands.onAppEvent<K>, [name, handler], options);
}

export function onEventSub<T>(
  kind: EventKind,
  handler: (envelope: EventEnvelope<T>) => void,
  options?: InvokeOptions,
): Promise<Unlisten> {
  return invokeCommand(commands.onEventSub<T>, [kind, handler], options);
}
