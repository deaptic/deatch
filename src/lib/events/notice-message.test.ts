/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawNotification } from "../types/index.ts";
import { noticeMessage } from "./notice-message.ts";

const base = {
  broadcaster_user_id: "1",
  system_message: "from twitch",
  chatter_user_name: "Viewer",
};

const notice = (n: Partial<RawNotification>) =>
  noticeMessage({ ...base, notice_type: "", ...n });

Deno.test("describes subs by plan", () => {
  assertEquals(
    notice({ notice_type: "sub", sub: { sub_tier: "2000", is_prime: false } }),
    "Viewer subscribed at Tier 2.",
  );
  assertEquals(
    notice({ notice_type: "sub", sub: { sub_tier: "1000", is_prime: true } }),
    "Viewer subscribed with Prime.",
  );
});

Deno.test("adds the streak to a resub only when there is one", () => {
  const resub = {
    sub_tier: "1000" as const,
    is_prime: false,
    cumulative_months: 14,
    streak_months: 3,
  };
  assertEquals(
    notice({ notice_type: "resub", resub }),
    "Viewer subscribed at Tier 1. They've subscribed for 14 months, currently on a 3 month streak!",
  );
  assertEquals(
    notice({ notice_type: "resub", resub: { ...resub, streak_months: null } }),
    "Viewer subscribed at Tier 1. They've subscribed for 14 months!",
  );
});

Deno.test("credits an anonymous gifter", () => {
  assertEquals(
    notice({
      notice_type: "community_sub_gift",
      chatter_is_anonymous: true,
      community_sub_gift: {
        sub_tier: "1000",
        total: 5,
        cumulative_total: null,
      },
    }),
    "An anonymous gifter is gifting 5 Tier 1 Subs to the community!",
  );
  assertEquals(
    notice({
      notice_type: "gift_paid_upgrade",
      gift_paid_upgrade: { gifter_is_anonymous: true, gifter_user_name: null },
    }),
    "Viewer is continuing the Gift Sub they got from an anonymous user!",
  );
});

Deno.test("reads the shared chat variant", () => {
  assertEquals(
    notice({
      notice_type: "shared_chat_raid",
      shared_chat_raid: { user_name: "Raider", viewer_count: 1 },
    }),
    "1 raider from Raider has joined!",
  );
});

Deno.test("formats a charity amount in its currency", () => {
  assertEquals(
    notice({
      notice_type: "charity_donation",
      charity_donation: {
        charity_name: "Kind Org",
        amount: { value: 1050, decimal_place: 2, currency: "USD" },
      },
    }),
    "Viewer donated US$10.50 to support Kind Org.",
  );
});

Deno.test("names who made an announcement", () => {
  assertEquals(
    notice({ notice_type: "announcement", system_message: "" }),
    "Announcement from Viewer",
  );
});

Deno.test("leaves unknown notices to Twitch's text", () => {
  assertEquals(notice({ notice_type: "modiversary" }), null);
  assertEquals(notice({ notice_type: "sub" }), null);
});
