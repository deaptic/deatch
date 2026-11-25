import { expect, test } from "vite-plus/test";
import type { RawNotification } from "../../../platform/twitch/eventsubPayloads.ts";
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
  ).toBe("Subscribed at Tier 2");
  expect(
    notice({ notice_type: "sub", sub: { sub_tier: "1000", is_prime: true } }),
  ).toBe("Subscribed with Prime");
});

test("adds the streak to a resub only when there is one", () => {
  const resub = {
    sub_tier: "1000" as const,
    is_prime: false,
    cumulative_months: 14,
    streak_months: 3,
  };
  expect(notice({ notice_type: "resub", resub })).toBe(
    "Resubscribed at Tier 1 (14 months, 3-month streak)",
  );
  expect(
    notice({ notice_type: "resub", resub: { ...resub, streak_months: null } }),
  ).toBe("Resubscribed at Tier 1 (14 months)");
});

test("adds a gifter's total only when there is one", () => {
  const gift = (cumulative_total: number | null) =>
    notice({
      notice_type: "community_sub_gift",
      community_sub_gift: { sub_tier: "1000", total: 5, cumulative_total },
    });
  expect(gift(null)).toBe("Gifted 5 Tier 1 subs to the community");
  expect(gift(40)).toBe("Gifted 5 Tier 1 subs to the community (40 total)");
});

test("credits an anonymous original gifter", () => {
  expect(
    notice({
      notice_type: "gift_paid_upgrade",
      gift_paid_upgrade: { gifter_is_anonymous: true, gifter_user_name: null },
    }),
  ).toBe("Continued their gift sub from an anonymous user");
});

test("reads the shared chat variant", () => {
  expect(
    notice({
      notice_type: "shared_chat_raid",
      shared_chat_raid: { user_name: "Raider", viewer_count: 1 },
    }),
  ).toBe("Raided with 1 viewer");
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
  ).toBe("Donated US$10.50 to Kind Org");
});

test("leaves an announcement to its own words", () => {
  expect(notice({ notice_type: "announcement", system_message: "" })).toBe("");
});

test("counts a moderator's months", () => {
  expect(
    notice({ notice_type: "modiversary", modiversary: { months: 84 } }),
  ).toBe("Has been a moderator for 84 months");
});

test("counts a watch streak", () => {
  expect(
    notice({ notice_type: "watch_streak", watch_streak: { streak_count: 80 } }),
  ).toBe("Watched 80 streams in a row");
});

test("leaves unknown notices to Twitch's text", () => {
  expect(notice({ notice_type: "watch_streak" })).toBeNull();
  expect(notice({ notice_type: "sub" })).toBeNull();
});
