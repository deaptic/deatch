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

Deno.test("counts the viewers sent on a raid", () => {
  const p: RawModerate = {
    ...base,
    action: "raid",
    raid: { ...user, viewer_count: 1200 },
  };
  assertEquals(
    moderateMessage(p, 0),
    "Mod initiated a raid on Foo with 1,200 viewers",
  );
});

Deno.test("lists the AutoMod terms a mod changed", () => {
  const p: RawModerate = {
    ...base,
    action: "add_blocked_term",
    automod_terms: {
      action: "add",
      list: "blocked",
      terms: ["foo", "bar"],
      from_automod: false,
    },
  };
  assertEquals(moderateMessage(p, 0), "Mod added blocked terms: foo, bar");
});

Deno.test("describes a resolved unban request with its note", () => {
  const p: RawModerate = {
    ...base,
    action: "deny_unban_request",
    unban_request: { ...user, is_approved: false, moderator_message: "no" },
  };
  assertEquals(moderateMessage(p, 0), "Mod denied Foo's unban request: no");
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
