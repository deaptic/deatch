import * as channelInfo from "../channelInfo.ts";
import { modifyChannelInformation } from "../../api/twitch/channels.ts";
import { searchCategories } from "../../api/twitch/search.ts";
import { t } from "../../i18n/index.ts";
import { channelInfoFor, streamForUserId } from "../../stores/channels.ts";
import { streamGame } from "../../format/stream.ts";
import type { Category } from "../../types/index.ts";
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
  if (!category) return t("TRIGGER_GAME_NOT_FOUND", { query: ctx.args });
  await modifyChannelInformation(
    { broadcasterId: ctx.broadcasterId, gameId: category.id },
    { silent: true },
  );
  return t("TRIGGER_GAME_UPDATED", { game: category.name });
}

export async function game(ctx: BuiltInContext): Promise<string | null> {
  if (ctx.isModerator && ctx.args) return change(ctx);
  await channelInfo.load([ctx.broadcasterId]);
  const current = streamGame(
    streamForUserId(ctx.broadcasterId),
    channelInfoFor(ctx.broadcasterId),
  );
  return current ? t("TRIGGER_GAME_CURRENT", { game: current }) : null;
}
