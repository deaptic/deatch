import * as users from "./users.ts";
import {
  type PinOutcome,
  pinChannel,
  reorderPinnedChannels,
  unpinChannel,
} from "../stores/preferences.ts";
import type { User } from "../types/index.ts";

/// Pins a channel, noting its user so the rail shows it without a fetch.
export function add(channel: User): PinOutcome {
  users.note([channel]);
  return pinChannel(channel.id);
}

export function remove(broadcasterId: string): void {
  unpinChannel(broadcasterId);
}

export function move(from: number, to: number): void {
  reorderPinnedChannels(from, to);
}
