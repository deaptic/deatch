/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawModerate } from "../types/index.ts";
import { moderateMessage } from "./moderate-message.ts";

const base = {
  broadcaster_user_id: "1",
  broadcaster_user_login: "here",
  broadcaster_user_name: "Here",
  moderator_user_id: "2",
  moderator_user_login: "mod",
  moderator_user_name: "Mod",
};
const user = { user_id: "3", user_login: "foo", user_name: "Foo" };

Deno.test("describes an action taken here", () => {
  const p: RawModerate = {
    ...base,
    action: "ban",
    ban: { ...user, reason: "spam" },
  };
  assertEquals(moderateMessage(p, 0), "Mod banned Foo: spam");
});

Deno.test("names the partner channel for a shared chat action", () => {
  const p: RawModerate = {
    ...base,
    source_broadcaster_user_id: "9",
    source_broadcaster_user_name: "Mira",
    action: "shared_chat_delete",
    shared_chat_delete: { ...user, message_id: "m1", message_body: "hi" },
  };
  assertEquals(
    moderateMessage(p, 0),
    "In Mira's chat, Mod deleted message from Foo saying: hi",
  );
});

Deno.test("times shared chat timeouts like local ones", () => {
  const p: RawModerate = {
    ...base,
    source_broadcaster_user_name: "Mira",
    action: "shared_chat_timeout",
    shared_chat_timeout: {
      ...user,
      reason: null,
      expires_at: new Date(600_000).toISOString(),
    },
  };
  assertEquals(
    moderateMessage(p, 0),
    "In Mira's chat, Mod timed out Foo for 10m",
  );
});
