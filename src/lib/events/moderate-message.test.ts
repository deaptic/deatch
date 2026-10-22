/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawModerate } from "../types/index.ts";
import { moderateMessage } from "./moderate-message.ts";
import { noticeText } from "../utils/feedEvent.ts";

/// The words alone; who they name is checked on its own.
function said(p: RawModerate) {
  const notice = moderateMessage(p, 0);
  return notice && noticeText(notice.text, notice.detail);
}

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
  assertEquals(said(p), {
    text: "Mod banned Foo",
    detail: "spam",
  });
});

Deno.test("links the mod and whoever they acted on", () => {
  const p: RawModerate = {
    ...base,
    action: "ban",
    ban: { ...user, reason: null },
  };
  assertEquals(moderateMessage(p, 0)?.people, [
    { id: "2", login: "mod", name: "Mod" },
    { id: "3", login: "foo", name: "Foo" },
  ]);
  const cleared: RawModerate = { ...base, action: "clear" };
  assertEquals(moderateMessage(cleared, 0)?.people, [
    { id: "2", login: "mod", name: "Mod" },
  ]);
});

Deno.test("counts the viewers sent on a raid", () => {
  const p: RawModerate = {
    ...base,
    action: "raid",
    raid: { ...user, viewer_count: 1200 },
  };
  assertEquals(
    said(p),
    { text: "Mod initiated a raid on Foo with 1,200 viewers" },
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
  assertEquals(said(p), {
    text: "Mod added blocked terms",
    detail: "foo and bar",
  });
});

Deno.test("describes a resolved unban request with its note", () => {
  const p: RawModerate = {
    ...base,
    action: "deny_unban_request",
    unban_request: { ...user, is_approved: false, moderator_message: "no" },
  };
  assertEquals(said(p), {
    text: "Mod denied Foo's unban request",
    detail: "no",
  });
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
    said(p),
    { text: "In Mira's chat, Mod deleted a message from Foo", detail: "hi" },
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
    said(p),
    { text: "In Mira's chat, Mod timed out Foo for 10m" },
  );
});
