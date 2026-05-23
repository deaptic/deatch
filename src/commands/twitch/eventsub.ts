import type { EventKind } from "../../types/twitch/eventsub";
import { invokeCommand, type InvokeOptions } from "../utils";

export type SubscribeParams = { broadcasterId: string; kind: EventKind };

export async function subscribe(
  params: SubscribeParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand("subscribe", params, options);
}

export async function unsubscribe(
  params: SubscribeParams,
  options?: InvokeOptions,
): Promise<void> {
  await invokeCommand("unsubscribe", params, options);
}
