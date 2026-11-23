import { users } from "../users/index.ts";
import {
  type PinOutcome,
  pinChannel,
  reorderPinnedChannels,
  unpinChannel,
} from "../preferences/index.ts";
import type { User } from "../../shared/types/index.ts";

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
