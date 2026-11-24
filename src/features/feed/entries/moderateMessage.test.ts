import { expect, test } from "vite-plus/test";
import type { RawModerate } from "../../../platform/twitch/eventsubPayloads.ts";
import { moderateMessage } from "./moderateMessage.ts";
import { noticeText } from "./feedEvent.ts";

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
const user = { user_id: "3", user_login: "viewer1", user_name: "Viewer1" };

test("describes an action taken here", () => {
  const p: RawModerate = {
    ...base,
    action: "ban",
    ban: { ...user, reason: "spam" },
  };
  expect(said(p)).toStrictEqual({
    text: "Mod banned Viewer1",
    detail: "spam",
  });
});

test("links the mod and whoever they acted on", () => {
  const p: RawModerate = {
    ...base,
    action: "ban",
    ban: { ...user, reason: null },
  };
  expect(moderateMessage(p, 0)?.people).toStrictEqual([
    { id: "2", login: "mod", name: "Mod" },
    { id: "3", login: "viewer1", name: "Viewer1" },
  ]);
  const cleared: RawModerate = { ...base, action: "clear" };
  expect(moderateMessage(cleared, 0)?.people).toStrictEqual([
    { id: "2", login: "mod", name: "Mod" },
  ]);
});

test("counts the viewers sent on a raid", () => {
  const p: RawModerate = {
    ...base,
    action: "raid",
    raid: { ...user, viewer_count: 1200 },
  };
  expect(said(p)).toStrictEqual({
    text: "Mod started a raid to Viewer1 with 1,200 viewers",
  });
});

test("lists the AutoMod terms a mod changed", () => {
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
  expect(said(p)).toStrictEqual({
    text: "Mod added blocked terms",
    detail: "foo and bar",
  });
});

test("describes a resolved unban request with its note", () => {
  const p: RawModerate = {
    ...base,
    action: "deny_unban_request",
    unban_request: { ...user, is_approved: false, moderator_message: "no" },
  };
  expect(said(p)).toStrictEqual({
    text: "Mod denied Viewer1's unban request",
    detail: "no",
  });
  expect(moderateMessage(p, 0)?.people).toStrictEqual([
    { id: "2", login: "mod", name: "Mod" },
    { id: "3", login: "viewer1", name: "Viewer1" },
  ]);
});

test("names the partner channel for a shared chat action", () => {
  const p: RawModerate = {
    ...base,
    source_broadcaster_user_id: "9",
    source_broadcaster_user_name: "Broadcaster",
    action: "shared_chat_delete",
    shared_chat_delete: { ...user, message_id: "m1", message_body: "hi" },
  };
  expect(said(p)).toStrictEqual({
    text: "In Broadcaster's chat, Mod deleted a message from Viewer1",
    detail: "hi",
  });
});

test("times shared chat timeouts like local ones", () => {
  const p: RawModerate = {
    ...base,
    source_broadcaster_user_name: "Broadcaster",
    action: "shared_chat_timeout",
    shared_chat_timeout: {
      ...user,
      reason: null,
      expires_at: new Date(600_000).toISOString(),
    },
  };
  expect(said(p)).toStrictEqual({
    text: "In Broadcaster's chat, Mod timed out Viewer1 for 10m",
  });
});
