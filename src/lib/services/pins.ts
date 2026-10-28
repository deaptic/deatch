import * as users from "./users.ts";
import { pinChannel } from "../stores/preferences.ts";
import type { User } from "../types/index.ts";

/// Pins a channel, noting its user so the rail shows it without a fetch.
/// False when it was already pinned or is the user's own.
export function add(channel: User): boolean {
  users.note([channel]);
  return pinChannel(channel.id);
}
