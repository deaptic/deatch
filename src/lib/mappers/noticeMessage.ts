import { formatAmount } from "../format/currency.ts";
import { t } from "../i18n/index.ts";
import type { RawNoticeDetails, RawNotification } from "../types/index.ts";

type Plan = { sub_tier: string; is_prime?: boolean | null };

export function detail<K extends keyof RawNoticeDetails>(
  raw: RawNotification,
  key: K,
): RawNoticeDetails[K] | undefined {
  return (raw[key] ?? raw[`shared_chat_${key}`]) as
    | RawNoticeDetails[K]
    | undefined;
}

function tier(subTier: string): number {
  return Number(subTier) / 1000;
}

function plan(p: Plan): string {
  return p.is_prime ? "prime" : String(tier(p.sub_tier));
}

function gifter(g: RawNoticeDetails["pay_it_forward"]) {
  return {
    anonymous: String(g.gifter_is_anonymous || !g.gifter_user_name),
    gifter: g.gifter_user_name ?? "",
  };
}

export function noticeMessage(raw: RawNotification): string | null {
  const name =
    raw.chatter_is_anonymous || !raw.chatter_user_name
      ? t("FEED_ANONYMOUS_GIFTER_VALUE")
      : raw.chatter_user_name;
  switch (raw.notice_type.replace(/^shared_chat_/, "")) {
    case "sub": {
      const d = detail(raw, "sub");
      return d ? t("FEED_SUB_LINE", { name, plan: plan(d) }) : null;
    }
    case "resub": {
      const d = detail(raw, "resub");
      return d
        ? t("FEED_RESUB_LINE", {
            name,
            plan: plan(d),
            months: d.cumulative_months,
            streak: d.streak_months ?? 0,
          })
        : null;
    }
    case "sub_gift": {
      const d = detail(raw, "sub_gift");
      return d
        ? t("FEED_SUB_GIFT_LINE", {
            name,
            tier: tier(d.sub_tier),
            recipient: d.recipient_user_name,
            total: d.cumulative_total ?? 0,
          })
        : null;
    }
    case "community_sub_gift": {
      const d = detail(raw, "community_sub_gift");
      return d
        ? t("FEED_COMMUNITY_SUB_GIFT_LINE", {
            name,
            tier: tier(d.sub_tier),
            count: d.total,
            total: d.cumulative_total ?? 0,
          })
        : null;
    }
    case "gift_paid_upgrade": {
      const d = detail(raw, "gift_paid_upgrade");
      return d
        ? t("FEED_GIFT_PAID_UPGRADE_LINE", { name, ...gifter(d) })
        : null;
    }
    case "pay_it_forward": {
      const d = detail(raw, "pay_it_forward");
      return d ? t("FEED_PAY_IT_FORWARD_LINE", { name, ...gifter(d) }) : null;
    }
    case "prime_paid_upgrade": {
      const d = detail(raw, "prime_paid_upgrade");
      return d
        ? t("FEED_PRIME_PAID_UPGRADE_LINE", { name, tier: tier(d.sub_tier) })
        : null;
    }
    case "raid": {
      const d = detail(raw, "raid");
      return d
        ? t("FEED_RAID_ARRIVED_LINE", {
            name: d.user_name,
            count: d.viewer_count,
          })
        : null;
    }
    case "bits_badge_tier": {
      const d = detail(raw, "bits_badge_tier");
      return d
        ? t("FEED_BITS_BADGE_EARNED_LINE", { name, tier: d.tier })
        : null;
    }
    case "charity_donation": {
      const d = detail(raw, "charity_donation");
      return d
        ? t("FEED_CHARITY_DONATED_LINE", {
            name,
            amount: formatAmount(d.amount),
            charity: d.charity_name,
          })
        : null;
    }
    case "modiversary": {
      const d = detail(raw, "modiversary");
      return d ? t("FEED_MODIVERSARY_LINE", { name, months: d.months }) : null;
    }
    case "announcement":
      return t("FEED_ANNOUNCEMENT_LINE", { name });
    default:
      return null;
  }
}
