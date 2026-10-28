import { expect, test } from "vite-plus/test";
import type { RawChatMessage } from "../types/index.ts";
import { mapChatMessage, wordsOf } from "./chat-mapper.ts";

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

test("maps chatter fields and timestamp", () => {
  const msg = mapChatMessage(raw(), 42);
  expect(msg.kind).toBe("message");
  expect(msg.message_id).toBe("m1");
  expect(msg.chatter_login).toBe("foo");
  expect(msg.chatter_name).toBe("Foo");
  expect(msg.timestamp).toBe(42);
  expect(msg.reply).toBeUndefined();
  expect(msg.first_message).toBe(false);
});

test("flattens every fragment kind", () => {
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
  expect(msg.fragments).toStrictEqual([
    { type: "text", text: "hi " },
    { type: "emote", text: "Kappa", id: "25" },
    { type: "mention", text: "@bar", user_login: "bar" },
    { type: "cheermote", text: "Cheer100", prefix: "Cheer", bits: 100 },
  ]);
});

test("keeps an event's words only when there are some", () => {
  expect(
    wordsOf({ text: "hi", fragments: [{ type: "text", text: "hi" }] }),
  ).toStrictEqual([{ type: "text", text: "hi" }]);
  expect(wordsOf({ text: "  ", fragments: [] })).toBeUndefined();
  expect(wordsOf(null)).toBeUndefined();
});

test("carries the cheered amount", () => {
  expect(mapChatMessage(raw({ cheer: { bits: 250 } }), 0).cheer).toStrictEqual({
    bits: 250,
  });
  expect(mapChatMessage(raw({ cheer: null }), 0).cheer).toBeUndefined();
});

test("keeps a GIF's URL exactly as Twitch sent it", () => {
  const url = "https://media0.giphy.com/x.gif?cid=abc&rid=x.gif";
  const msg = mapChatMessage(
    raw({
      message: {
        text: "[Hello GIF]",
        fragments: [
          {
            type: "gif",
            text: "[Hello GIF]",
            gif: { id: "x", url },
          },
        ],
      },
    }),
    0,
  );
  expect(msg.fragments).toStrictEqual([
    { type: "gif", text: "[Hello GIF]", url },
  ]);
});

test("shows fragment types it doesn't know as their text", () => {
  const sticker = {
    type: "sticker",
    text: "[Sticker]",
  } as unknown as RawChatMessage["message"]["fragments"][number];
  const msg = mapChatMessage(
    raw({ message: { text: "[Sticker]", fragments: [sticker] } }),
    0,
  );
  expect(msg.fragments).toStrictEqual([{ type: "text", text: "[Sticker]" }]);
});

test("classifies channel point messages", () => {
  const reward = mapChatMessage(
    raw({ channel_points_custom_reward_id: "r1" }),
    0,
  );
  const highlight = mapChatMessage(
    raw({ message_type: "channel_points_highlighted" }),
    0,
  );
  expect(reward.channel_points).toStrictEqual({ kind: "custom_reward" });
  expect(highlight.channel_points).toStrictEqual({ kind: "highlight" });
  expect(mapChatMessage(raw(), 0).channel_points).toBeUndefined();
});

test("keeps bits Power-ups apart from channel points", () => {
  const gigantified = mapChatMessage(
    raw({ message_type: "power_ups_gigantified_emote" }),
    0,
  );
  expect(gigantified.power_up).toBe("gigantified_emote");
  expect(gigantified.channel_points).toBeUndefined();
  expect(mapChatMessage(raw(), 0).power_up).toBeUndefined();
});

test("marks only shared chat messages with their source channel", () => {
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
  const unshared = mapChatMessage(raw({ source_broadcaster_user_id: null }), 0);
  expect(shared.source).toStrictEqual({
    id: "333",
    login: "mira",
    name: "Mira",
    messageId: "orig",
    badges: [{ set_id: "subscriber", id: "12", info: "12" }],
  });
  expect(unshared.source).toBeUndefined();
  expect(mapChatMessage(raw(), 0).source).toBeUndefined();
  const local = mapChatMessage(
    raw({ source_broadcaster_user_id: raw().broadcaster_user_id }),
    0,
  );
  expect(local.source).toBeUndefined();
});

test("marks first-time chatters and keeps deleted backlog flag", () => {
  const msg = mapChatMessage(
    raw({ message_type: "user_intro", deleted: true }),
    0,
  );
  expect(msg.first_message).toBe(true);
  expect(msg.deleted).toBe(true);
});
