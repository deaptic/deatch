import * as channelInfo from "../channelInfo.ts";
import { modifyChannelInformation } from "../../api/twitch/channels.ts";
import { t } from "../../i18n/index.ts";
import { channelInfoFor, streamForUserId } from "../../stores/channels.ts";
import { streamTitle } from "../../format/stream.ts";
import type { BuiltInContext } from "./context.ts";

export async function title(ctx: BuiltInContext): Promise<string | null> {
  if (ctx.isModerator && ctx.args) {
    await modifyChannelInformation(
      { broadcasterId: ctx.broadcasterId, title: ctx.args },
      { silent: true },
    );
    return t("TRIGGER_TITLE_UPDATED", { title: ctx.args });
  }
  await channelInfo.load([ctx.broadcasterId]);
  const current = streamTitle(
    streamForUserId(ctx.broadcasterId),
    channelInfoFor(ctx.broadcasterId),
  );
  return current ? t("TRIGGER_TITLE_CURRENT", { title: current }) : null;
}
