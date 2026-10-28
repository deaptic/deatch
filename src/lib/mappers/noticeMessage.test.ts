import { expect, test } from "vite-plus/test";
import type { RawNotification } from "../types/index.ts";
import { noticeMessage } from "./noticeMessage.ts";

const base = {
  broadcaster_user_id: "1",
  message_id: "n1",
  system_message: "from twitch",
  chatter_user_name: "Viewer",
};

const notice = (n: Partial<RawNotification>) =>
  noticeMessage({ ...base, notice_type: "", ...n });

test("describes subs by plan", () => {
  expect(
    notice({ notice_type: "sub", sub: { sub_tier: "2000", is_prime: false } }),
  ).toBe("Viewer subscribed at Tier 2.");
  expect(
    notice({ notice_type: "sub", sub: { sub_tier: "1000", is_prime: true } }),
  ).toBe("Viewer subscribed with Prime.");
});

test("adds the streak to a resub only when there is one", () => {
  const resub = {
    sub_tier: "1000" as const,
    is_prime: false,
    cumulative_months: 14,
    streak_months: 3,
  };
  expect(notice({ notice_type: "resub", resub })).toBe(
    "Viewer subscribed at Tier 1. They've subscribed for 14 months, currently on a 3 month streak!",
  );
  expect(
    notice({ notice_type: "resub", resub: { ...resub, streak_months: null } }),
  ).toBe("Viewer subscribed at Tier 1. They've subscribed for 14 months!");
});

test("credits an anonymous gifter", () => {
  expect(
    notice({
      notice_type: "community_sub_gift",
      chatter_is_anonymous: true,
      community_sub_gift: {
        sub_tier: "1000",
        total: 5,
        cumulative_total: null,
      },
    }),
  ).toBe("An anonymous gifter is gifting 5 Tier 1 Subs to the community!");
  expect(
    notice({
      notice_type: "gift_paid_upgrade",
      gift_paid_upgrade: { gifter_is_anonymous: true, gifter_user_name: null },
    }),
  ).toBe("Viewer is continuing the Gift Sub they got from an anonymous user!");
});

test("reads the shared chat variant", () => {
  expect(
    notice({
      notice_type: "shared_chat_raid",
      shared_chat_raid: { user_name: "Raider", viewer_count: 1 },
    }),
  ).toBe("1 raider from Raider has joined!");
});

test("formats a charity amount in its currency", () => {
  expect(
    notice({
      notice_type: "charity_donation",
      charity_donation: {
        charity_name: "Kind Org",
        amount: { value: 1050, decimal_place: 2, currency: "USD" },
      },
    }),
  ).toBe("Viewer donated US$10.50 to support Kind Org.");
});

test("names who made an announcement", () => {
  expect(notice({ notice_type: "announcement", system_message: "" })).toBe(
    "Announcement from Viewer",
  );
});

test("counts a moderator's months", () => {
  expect(
    notice({ notice_type: "modiversary", modiversary: { months: 84 } }),
  ).toBe("Viewer has been a moderator for 84 months!");
});

test("leaves unknown notices to Twitch's text", () => {
  expect(notice({ notice_type: "watch_streak" })).toBeNull();
  expect(notice({ notice_type: "sub" })).toBeNull();
});
