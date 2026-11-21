import { t } from "../../../lib/i18n/index.ts";
import { sourceBadges } from "../../../lib/stores/sourceBadges.ts";
import type {
  AutomodHoldInfo,
  BadgeMap,
  FeedMessage as Message,
} from "../../../lib/types/index.ts";
import { GROUP_COLORS } from "../groups.ts";

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

export function toneColor(
  item: Message,
  highlighted: boolean,
): string | undefined {
  if (item.automod_hold) return GROUP_COLORS.moderation;
  if (highlighted) return "var(--color-accent)";
  if (item.cheer || item.power_up) return GROUP_COLORS.support;
  if (item.channel_points) return GROUP_COLORS.engagement;
  if (item.first_message) return GROUP_COLORS.community;
  return undefined;
}

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

export function chatterBadges(item: Message) {
  return item.source?.badges ?? item.badges;
}

export function badgeMap(item: Message, channel: BadgeMap): BadgeMap {
  return (item.source && sourceBadges[item.source.id]) || channel;
}
