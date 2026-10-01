/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawChatMessage } from "../types/index.ts";
import { mapChatMessage } from "./chat-mapper.ts";

const raw = (overrides: Partial<RawChatMessage> = {}): RawChatMessage => ({
  broadcaster_user_id: "111",
  message_id: "m1",
  chatter_user_id: "222",
  chatter_user_login: "foo",
  chatter_user_name: "Foo",
  color: "#FF0000",
  message: { text: "", fragments: [] },
  message_type: "text",
  badges: [],
  reply: null,
  channel_points_custom_reward_id: null,
  ...overrides,
});

Deno.test("maps chatter fields and timestamp", () => {
  const msg = mapChatMessage(raw(), 42);
  assertEquals(msg.kind, "message");
  assertEquals(msg.message_id, "m1");
  assertEquals(msg.chatter_login, "foo");
  assertEquals(msg.chatter_name, "Foo");
  assertEquals(msg.timestamp, 42);
  assertEquals(msg.reply, undefined);
  assertEquals(msg.first_message, false);
});

Deno.test("flattens every fragment kind", () => {
  const msg = mapChatMessage(
    raw({
      message: {
        text: "hi Kappa @bar Cheer100",
        fragments: [
          { type: "text", text: "hi " },
          { type: "emote", text: "Kappa", emote: { id: "25" } },
          { type: "mention", text: "@bar", mention: { user_login: "bar" } },
          {
            type: "cheermote",
            text: "Cheer100",
            cheermote: { prefix: "Cheer", bits: 100, tier: 100 },
          },
        ],
      },
    }),
    0,
  );
  assertEquals(msg.fragments, [
    { type: "text", text: "hi " },
    { type: "emote", text: "Kappa", id: "25" },
    { type: "mention", text: "@bar", user_login: "bar" },
    { type: "cheermote", text: "Cheer100", prefix: "Cheer", bits: 100 },
  ]);
});

Deno.test("carries the cheered amount", () => {
  assertEquals(mapChatMessage(raw({ cheer: { bits: 250 } }), 0).cheer, {
    bits: 250,
  });
  assertEquals(mapChatMessage(raw({ cheer: null }), 0).cheer, undefined);
});

Deno.test("shows fragment types it doesn't know as their text", () => {
  const gif = {
    type: "gif",
    text: "[Hello GIF]",
    gif: { id: "x", url: "https://media0.giphy.com/x.gif" },
  } as unknown as RawChatMessage["message"]["fragments"][number];
  const msg = mapChatMessage(
    raw({ message: { text: "[Hello GIF]", fragments: [gif] } }),
    0,
  );
  assertEquals(msg.fragments, [{ type: "text", text: "[Hello GIF]" }]);
});

Deno.test("classifies channel point messages", () => {
  const reward = mapChatMessage(
    raw({ channel_points_custom_reward_id: "r1" }),
    0,
  );
  const highlight = mapChatMessage(
    raw({ message_type: "channel_points_highlighted" }),
    0,
  );
  assertEquals(reward.channel_points, { kind: "custom_reward" });
  assertEquals(highlight.channel_points, { kind: "highlight" });
  assertEquals(mapChatMessage(raw(), 0).channel_points, undefined);
});

Deno.test("marks first-time chatters and keeps deleted backlog flag", () => {
  const msg = mapChatMessage(
    raw({ message_type: "user_intro", deleted: true }),
    0,
  );
  assertEquals(msg.first_message, true);
  assertEquals(msg.deleted, true);
});
