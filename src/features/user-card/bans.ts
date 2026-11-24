import { banUser, unbanUser } from "../../platform/twitch/moderation.ts";
import { type BanChoice, secondsFor } from "./banDurations.ts";
import type { InvokeOptions } from "../../platform/invoke.ts";
import type { BroadcasterUserParams } from "../../shared/types/index.ts";

export function apply(
  target: BroadcasterUserParams,
  choice: BanChoice,
  reason?: string,
  options?: InvokeOptions,
): Promise<void> {
  return choice === "unban"
    ? unbanUser(target, options)
    : banUser({ ...target, duration: secondsFor(choice), reason }, options);
}
