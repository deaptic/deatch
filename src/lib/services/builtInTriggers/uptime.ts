import { t } from "../../i18n/index.ts";
import { streamForUserId } from "../../stores/channels.ts";
import { formatElapsed } from "../../format/duration.ts";
import { channelName, type BuiltInContext } from "./context.ts";

export function uptime(ctx: BuiltInContext): Promise<string> {
  const live = streamForUserId(ctx.broadcasterId);
  const channel = channelName(ctx);
  return Promise.resolve(
    live
      ? t("TRIGGER_UPTIME_LIVE", {
          channel,
          duration: formatElapsed(Date.parse(live.startedAt), Date.now()),
        })
      : t("TRIGGER_UPTIME_OFFLINE", { channel }),
  );
}
