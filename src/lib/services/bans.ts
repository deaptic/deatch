import { banUser, unbanUser } from "../api/twitch/moderation.ts";
import { type BanChoice, secondsFor } from "../constants/timeouts.ts";
import type { BroadcasterUserParams } from "../types/index.ts";

/// Unbans, or bans for the choice's duration (forever for "ban").
export function apply(
  target: BroadcasterUserParams,
  choice: BanChoice,
  reason?: string,
): Promise<void> {
  return choice === "unban"
    ? unbanUser(target)
    : banUser({ ...target, duration: secondsFor(choice), reason });
}
