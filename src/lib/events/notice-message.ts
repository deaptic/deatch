// Our own text for channel.chat.notification, built from the structured
// fields so it follows the app locale; null leaves Twitch's system_message.

import { formatLocale, t } from "../i18n/index.ts";
import type { RawNoticeDetails, RawNotification } from "../types/index.ts";

type Plan = { sub_tier: string; is_prime?: boolean | null };

function detail<K extends keyof RawNoticeDetails>(
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

function currency(amount: RawNoticeDetails["charity_donation"]["amount"]) {
  return new Intl.NumberFormat(formatLocale(), {
    style: "currency",
    currency: amount.currency,
  }).format(amount.value / 10 ** amount.decimal_place);
}

export function noticeMessage(raw: RawNotification): string | null {
  const name = raw.chatter_is_anonymous || !raw.chatter_user_name
    ? t("NOTICE_ANONYMOUS")
    : raw.chatter_user_name;
  switch (raw.notice_type.replace(/^shared_chat_/, "")) {
    case "sub": {
      const d = detail(raw, "sub");
      return d ? t("NOTICE_SUB", { name, plan: plan(d) }) : null;
    }
    case "resub": {
      const d = detail(raw, "resub");
      return d
        ? t("NOTICE_RESUB", {
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
        ? t("NOTICE_SUB_GIFT", {
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
        ? t("NOTICE_COMMUNITY_SUB_GIFT", {
          name,
          tier: tier(d.sub_tier),
          count: d.total,
          total: d.cumulative_total ?? 0,
        })
        : null;
    }
    case "gift_paid_upgrade": {
      const d = detail(raw, "gift_paid_upgrade");
      return d ? t("NOTICE_GIFT_PAID_UPGRADE", { name, ...gifter(d) }) : null;
    }
    case "pay_it_forward": {
      const d = detail(raw, "pay_it_forward");
      return d ? t("NOTICE_PAY_IT_FORWARD", { name, ...gifter(d) }) : null;
    }
    case "prime_paid_upgrade": {
      const d = detail(raw, "prime_paid_upgrade");
      return d
        ? t("NOTICE_PRIME_PAID_UPGRADE", { name, tier: tier(d.sub_tier) })
        : null;
    }
    case "raid": {
      const d = detail(raw, "raid");
      return d
        ? t("NOTICE_RAID", { name: d.user_name, count: d.viewer_count })
        : null;
    }
    case "bits_badge_tier": {
      const d = detail(raw, "bits_badge_tier");
      return d ? t("NOTICE_BITS_BADGE_TIER", { name, tier: d.tier }) : null;
    }
    case "charity_donation": {
      const d = detail(raw, "charity_donation");
      return d
        ? t("NOTICE_CHARITY_DONATION", {
          name,
          amount: currency(d.amount),
          charity: d.charity_name,
        })
        : null;
    }
    default:
      return null;
  }
}
