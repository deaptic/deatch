import { t } from "../../../lib/i18n/index.ts";
import { sourceBadges } from "../../../lib/stores/sourceBadges.ts";
import type {
  AutomodHoldInfo,
  BadgeMap,
  FeedMessage as Message,
} from "../../../lib/types/index.ts";
import type { RowTone } from "../item/index.ts";

export function isHoldPending(item: Message): boolean {
  return item.automod_hold?.status === "pending";
}

export function isHoldResolved(item: Message): boolean {
  const status = item.automod_hold?.status;
  return status === "approved" || status === "denied" || status === "expired";
}

export function holdOutcome(hold: AutomodHoldInfo): string {
  return hold.moderator
    ? t("FEED_AUTOMOD_STATUS_BY", { status: hold.status, mod: hold.moderator })
    : t("FEED_AUTOMOD_STATUS", { status: hold.status });
}

/// The one tone a message wears, in precedence order.
export function tone(item: Message, highlighted: boolean): RowTone {
  if (item.automod_hold) return "held";
  if (highlighted) return "mention";
  if (item.cheer || item.power_up) return "cheer";
  if (item.channel_points) return "redemption";
  if (item.first_message) return "first";
  return "plain";
}

/// What channel points bought with the message, if anything.
export function pointsLabel(item: Message): string | undefined {
  const points = item.channel_points;
  if (!points) return undefined;
  if (points.kind !== "custom_reward") {
    return t("FEED_MESSAGE_PERK", { perk: points.kind });
  }
  return points.redemption
    ? t("FEED_REDEEMED_REWARD", {
        reward: points.redemption.reward.title,
        cost: points.redemption.reward.cost,
      })
    : t("FEED_REDEEMED_CHANNEL_POINTS");
}

// A partner chatter wears the badges of the channel they chatted in, which
// fall back to this channel's map (global badges) until that set loads.
export function chatterBadges(item: Message) {
  return item.source?.badges ?? item.badges;
}

export function badgeMap(item: Message, channel: BadgeMap): BadgeMap {
  return (item.source && sourceBadges[item.source.id]) || channel;
}
