import { banUser, unbanUser } from "../../platform/twitch/moderation.ts";
import { type BanChoice, secondsFor } from "../constants/timeouts.ts";
import type { BroadcasterUserParams } from "../types/index.ts";

export function apply(
  target: BroadcasterUserParams,
  choice: BanChoice,
  reason?: string,
): Promise<void> {
  return choice === "unban"
    ? unbanUser(target)
    : banUser({ ...target, duration: secondsFor(choice), reason });
}
