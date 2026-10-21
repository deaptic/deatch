/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawNotification } from "../types/index.ts";
import { mapNotice } from "./notice-mapper.ts";

const raw = (n: Partial<RawNotification>): RawNotification => ({
  broadcaster_user_id: "1",
  message_id: "n1",
  notice_type: "unknown",
  system_message: "from twitch",
  chatter_user_name: "Viewer",
  ...n,
});

Deno.test("keys a notice by Twitch's message id", () => {
  assertEquals(mapNotice(raw({}), 0)?.id, "n1");
});

Deno.test("drops a notice with nothing to show", () => {
  assertEquals(mapNotice(raw({ system_message: " " }), 0), null);
});

Deno.test("keeps the chatter's own text", () => {
  const item = mapNotice(
    raw({
      message: { text: "hi", fragments: [{ type: "text", text: "hi" }] },
    }),
    0,
  );
  assertEquals(item?.message, [{ type: "text", text: "hi" }]);
});
