import { createSignal } from "solid-js";
import type { Channel } from "../types";

export const [selectedChannel, setSelectedChannel] = createSignal<Channel | null>(null);

export const channelsById = new Map<string, Channel>();

export function rememberChannel(ch: Channel) {
  channelsById.set(ch.user_id, ch);
}
