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

Deno.test("keeps a GIF's URL exactly as Twitch sent it", () => {
  const url = "https://media0.giphy.com/x.gif?cid=abc&rid=x.gif";
  const msg = mapChatMessage(
    raw({
      message: {
        text: "[Hello GIF]",
        fragments: [{
          type: "gif",
          text: "[Hello GIF]",
          gif: { id: "x", url },
        }],
      },
    }),
    0,
  );
  assertEquals(msg.fragments, [{ type: "gif", text: "[Hello GIF]", url }]);
});

Deno.test("shows fragment types it doesn't know as their text", () => {
  const sticker = {
    type: "sticker",
    text: "[Sticker]",
  } as unknown as RawChatMessage["message"]["fragments"][number];
  const msg = mapChatMessage(
    raw({ message: { text: "[Sticker]", fragments: [sticker] } }),
    0,
  );
  assertEquals(msg.fragments, [{ type: "text", text: "[Sticker]" }]);
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

Deno.test("keeps bits Power-ups apart from channel points", () => {
  const gigantified = mapChatMessage(
    raw({ message_type: "power_ups_gigantified_emote" }),
    0,
  );
  assertEquals(gigantified.power_up, "gigantified_emote");
  assertEquals(gigantified.channel_points, undefined);
  assertEquals(mapChatMessage(raw(), 0).power_up, undefined);
});

Deno.test("marks only shared chat messages with their source channel", () => {
  const shared = mapChatMessage(
    raw({
      source_broadcaster_user_id: "333",
      source_broadcaster_user_login: "mira",
      source_broadcaster_user_name: "Mira",
      source_message_id: "orig",
      source_badges: [{ set_id: "subscriber", id: "12", info: "12" }],
    }),
    0,
  );
  const unshared = mapChatMessage(
    raw({ source_broadcaster_user_id: null }),
    0,
  );
  assertEquals(shared.source, {
    id: "333",
    login: "mira",
    name: "Mira",
    messageId: "orig",
    badges: [{ set_id: "subscriber", id: "12", info: "12" }],
  });
  assertEquals(unshared.source, undefined);
  assertEquals(mapChatMessage(raw(), 0).source, undefined);
  const local = mapChatMessage(
    raw({ source_broadcaster_user_id: raw().broadcaster_user_id }),
    0,
  );
  assertEquals(local.source, undefined);
});

Deno.test("marks first-time chatters and keeps deleted backlog flag", () => {
  const msg = mapChatMessage(
    raw({ message_type: "user_intro", deleted: true }),
    0,
  );
  assertEquals(msg.first_message, true);
  assertEquals(msg.deleted, true);
});
