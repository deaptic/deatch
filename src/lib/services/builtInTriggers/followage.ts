import * as users from "../users.ts";
import { t } from "../../i18n/index.ts";
import { formatElapsed } from "../../format/duration.ts";
import { Time } from "../../utils/time.ts";
import type { User } from "../../types/index.ts";
import { type BuiltInContext, failed, forTarget } from "./context.ts";

async function followage(
  ctx: BuiltInContext,
  user: User,
  self: boolean,
): Promise<string> {
  const values = { target: user.displayName, self: String(self) };
  const status = await users.followStatus(ctx.broadcasterId, user.id);
  switch (status.kind) {
    case "since":
      return t("TRIGGER_FOLLOWAGE_REPLY", {
        ...values,
        duration: formatElapsed(Date.parse(status.at), Date.now()),
        date: new Time(status.at, "d").toString(),
      });
    case "none":
      return t("TRIGGER_NOT_FOLLOWING_REPLY", values);
    case "hidden":
    case "unknown":
      return failed();
  }
}

export function followageOf(ctx: BuiltInContext): Promise<string> {
  return forTarget(ctx, (user, self) => followage(ctx, user, self));
}
