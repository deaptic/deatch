import { t } from "../../../shared/i18n/index.ts";
import { streamForUserId } from "../../../lib/stores/channels.ts";
import { formatElapsed } from "../../../shared/format/duration.ts";
import type { BuiltInContext } from "./context.ts";

export function uptime(ctx: BuiltInContext): Promise<string> {
  const live = streamForUserId(ctx.broadcasterId);
  return Promise.resolve(
    live
      ? t("TRIGGER_UPTIME_REPLY", {
          duration: formatElapsed(Date.parse(live.startedAt), Date.now()),
        })
      : t("TRIGGER_UPTIME_OFFLINE_REPLY"),
  );
}
