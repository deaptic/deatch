import { createSignal } from "solid-js";

export type ApiState = "unknown" | "connected" | "disconnected";

export const [apiState, setApiState] = createSignal<ApiState>("unknown");

export type ChatterPresence = "online" | "offline";

export const [presenceById, setPresenceById] = createSignal<
  ReadonlyMap<string, ChatterPresence>
>(new Map());

export function presenceOf(twitchId: string): ChatterPresence | undefined {
  return presenceById().get(twitchId);
}
