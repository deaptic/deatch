import * as channelInfo from "../../../lib/services/channelInfo.ts";
import { modifyChannelInformation } from "../../../platform/twitch/channels.ts";
import { t } from "../../../shared/i18n/index.ts";
import {
  channelInfoFor,
  streamForUserId,
} from "../../../lib/stores/channels.ts";
import { streamTitle } from "../../../shared/format/stream.ts";
import type { BuiltInContext } from "./context.ts";

export async function title(ctx: BuiltInContext): Promise<string | null> {
  if (ctx.isModerator && ctx.args) {
    await modifyChannelInformation(
      { broadcasterId: ctx.broadcasterId, title: ctx.args },
      { silent: true },
    );
    return t("TRIGGER_TITLE_UPDATED_REPLY", { title: ctx.args });
  }
  await channelInfo.load([ctx.broadcasterId]);
  const current = streamTitle(
    streamForUserId(ctx.broadcasterId),
    channelInfoFor(ctx.broadcasterId),
  );
  return current ? t("TRIGGER_TITLE_REPLY", { title: current }) : null;
}
