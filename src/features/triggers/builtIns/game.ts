import { channelInfo } from "../../channels/index.ts";
import { modifyChannelInformation } from "../../../platform/twitch/channels.ts";
import { searchCategories } from "../../../platform/twitch/search.ts";
import { t } from "../../../shared/i18n/index.ts";
import { channelInfoFor, streamForUserId } from "../../channels/index.ts";
import { streamGame } from "../../../shared/format/stream.ts";
import type { Category } from "../../../lib/types/index.ts";
import type { BuiltInContext } from "./context.ts";

const CANDIDATES = 8;

function bestMatch(query: string, found: Category[]): Category | undefined {
  const wanted = query.toLowerCase();
  return found.find((c) => c.name.toLowerCase() === wanted) ?? found[0];
}

async function change(ctx: BuiltInContext): Promise<string> {
  const found = await searchCategories(
    { query: ctx.args, first: CANDIDATES },
    { silent: true },
  );
  const category = bestMatch(ctx.args, found);
  if (!category) return t("TRIGGER_GAME_NOT_FOUND_REPLY", { query: ctx.args });
  await modifyChannelInformation(
    { broadcasterId: ctx.broadcasterId, gameId: category.id },
    { silent: true },
  );
  return t("TRIGGER_GAME_UPDATED_REPLY", { game: category.name });
}

export async function game(ctx: BuiltInContext): Promise<string | null> {
  if (ctx.isModerator && ctx.args) return change(ctx);
  await channelInfo.load([ctx.broadcasterId]);
  const current = streamGame(
    streamForUserId(ctx.broadcasterId),
    channelInfoFor(ctx.broadcasterId),
  );
  return current ? t("TRIGGER_GAME_REPLY", { game: current }) : null;
}
