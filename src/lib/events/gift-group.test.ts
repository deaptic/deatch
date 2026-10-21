/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawNotification } from "../types/index.ts";
import { giftGroup } from "./gift-group.ts";

const notice = (n: Partial<RawNotification>): RawNotification => ({
  broadcaster_user_id: "1",
  message_id: "n1",
  notice_type: "",
  system_message: "",
  ...n,
});

Deno.test("ties a community gift and its subs together", () => {
  assertEquals(
    giftGroup(notice({
      notice_type: "community_sub_gift",
      community_sub_gift: {
        id: "g1",
        sub_tier: "1000",
        total: 5,
        cumulative_total: null,
      },
    })),
    { role: "community", giftId: "g1" },
  );
  assertEquals(
    giftGroup(notice({
      notice_type: "shared_chat_sub_gift",
      shared_chat_sub_gift: {
        sub_tier: "1000",
        recipient_user_name: "Bar",
        cumulative_total: null,
        community_gift_id: "g1",
      },
    })),
    { role: "member", giftId: "g1", recipient: "Bar" },
  );
});

Deno.test("leaves a direct gift on its own", () => {
  assertEquals(
    giftGroup(notice({
      notice_type: "sub_gift",
      sub_gift: {
        sub_tier: "1000",
        recipient_user_name: "Bar",
        cumulative_total: null,
        community_gift_id: null,
      },
    })),
    null,
  );
});
