import { banUser, unbanUser } from "../../platform/twitch/moderation.ts";
import { type BanChoice, secondsFor } from "../../lib/constants/timeouts.ts";
import type { BroadcasterUserParams } from "../../lib/types/index.ts";

export function apply(
  target: BroadcasterUserParams,
  choice: BanChoice,
  reason?: string,
): Promise<void> {
  return choice === "unban"
    ? unbanUser(target)
    : banUser({ ...target, duration: secondsFor(choice), reason });
}
