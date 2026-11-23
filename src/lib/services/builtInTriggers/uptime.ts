import { t } from "../../i18n/index.ts";
import { streamForUserId } from "../../stores/channels.ts";
import { formatElapsed } from "../../format/duration.ts";
import type { BuiltInContext } from "./context.ts";

export function uptime(ctx: BuiltInContext): Promise<string> {
  const live = streamForUserId(ctx.broadcasterId);
  return Promise.resolve(
    live
      ? t("TRIGGER_UPTIME_LIVE", {
          duration: formatElapsed(Date.parse(live.startedAt), Date.now()),
        })
      : t("TRIGGER_UPTIME_OFFLINE"),
  );
}
