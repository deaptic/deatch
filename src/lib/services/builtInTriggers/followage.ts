import * as users from "../users.ts";
import { t } from "../../i18n/index.ts";
import { formatElapsed } from "../../format/duration.ts";
import type { User } from "../../types/index.ts";
import {
  channelName,
  type BuiltInContext,
  failed,
  forTarget,
} from "./context.ts";

async function followage(ctx: BuiltInContext, user: User): Promise<string> {
  const values = { target: user.displayName, channel: channelName(ctx) };
  const status = await users.followStatus(ctx.broadcasterId, user.id);
  switch (status.kind) {
    case "since":
      return t("TRIGGER_FOLLOWAGE_SINCE", {
        ...values,
        duration: formatElapsed(Date.parse(status.at), Date.now()),
      });
    case "none":
      return t("TRIGGER_FOLLOWAGE_NONE", values);
    case "hidden":
    case "unknown":
      return failed();
  }
}

export function followageOf(ctx: BuiltInContext): Promise<string> {
  return forTarget(ctx, (user) => followage(ctx, user));
}
