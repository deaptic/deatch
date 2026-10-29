import { beforeEach, expect, test } from "vite-plus/test";
import type { FeedEntry, User } from "../../types/index.ts";
import { userFromRef } from "../../utils/knownUsers.ts";
import { commitSelectedChannel } from "../view.ts";
import { setFeedEvent, setFeedShowEvents } from "../preferences/feed.ts";
import { ensureFeed, setFeeds } from "./core.ts";
import { appendItem } from "./write.ts";
import { hasUnread, isFeedEntryVisible, markSeen } from "./read.ts";

const message = (id: string): FeedEntry =>
  ({ kind: "message", message_id: id, timestamp: 1 }) as unknown as FeedEntry;

const event = (id: string, notice_type: string, silent = false): FeedEntry =>
  ({
    kind: "event",
    id,
    notice_type,
    silent,
    timestamp: 1,
  }) as unknown as FeedEntry;

const channel = (id: string): User =>
  userFromRef({ id, login: id, displayName: id });

beforeEach(() => {
  commitSelectedChannel(null);
  setFeedShowEvents(true);
  setFeedEvent("message", true);
  setFeedEvent("raid", true);
});

test("a channel is unread once something visible lands after it was seen", () => {
  ensureFeed("u1");
  expect(hasUnread("u1")).toBe(false);
  appendItem("u1", message("a"));
  expect(hasUnread("u1")).toBe(true);
  markSeen("u1");
  expect(hasUnread("u1")).toBe(false);
  appendItem("u1", event("e", "raid", true));
  expect(hasUnread("u1")).toBe(false);
  appendItem("u1", message("b"));
  expect(hasUnread("u1")).toBe(true);
});

test("the open channel and a missing feed are never unread", () => {
  ensureFeed("u2");
  appendItem("u2", message("a"));
  commitSelectedChannel(channel("u2"));
  expect(hasUnread("u2")).toBe(false);
  expect(hasUnread("missing")).toBe(false);
});

test("the divider marks what was seen while it stands", () => {
  ensureFeed("u3");
  appendItem("u3", message("a"));
  setFeeds("u3", "dividerAtEntryId", "a");
  expect(hasUnread("u3")).toBe(false);
});

test("hidden event types and messages drop out, AutoMod holds stay", () => {
  expect(isFeedEntryVisible(event("e", "raid"))).toBe(true);
  setFeedEvent("raid", false);
  expect(isFeedEntryVisible(event("e", "raid"))).toBe(false);
  setFeedEvent("raid", true);
  setFeedShowEvents(false);
  expect(isFeedEntryVisible(event("e", "raid"))).toBe(false);
  expect(isFeedEntryVisible(event("e", "not_an_event_type"))).toBe(true);

  setFeedEvent("message", false);
  expect(isFeedEntryVisible(message("m"))).toBe(false);
  const held = { ...message("h"), automod_hold: {} } as unknown as FeedEntry;
  expect(isFeedEntryVisible(held)).toBe(true);
});
