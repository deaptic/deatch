import { expect, test } from "vite-plus/test";
import {
  conversationsOf,
  countUnread,
  feedMessageOf,
  threadWith,
  whisperFrom,
  withSaved,
} from "./model.ts";
import type { Whisper } from "../../shared/types/index.ts";

const peer = (id: string) => ({ id, login: id, displayName: id.toUpperCase() });

const whisper = (
  id: string,
  from: string,
  timestamp: number,
  unread = false,
): Whisper => ({
  id,
  peer: peer(from),
  outgoing: false,
  text: id,
  timestamp,
  unread,
});

test("a received whisper is from its sender", () => {
  const raw = {
    from_user_id: "1",
    from_user_login: "alice",
    from_user_name: "Alice",
    whisper_id: "w1",
    whisper: { text: "hey" },
  };
  expect(whisperFrom(raw, 5, true)).toEqual({
    id: "w1",
    peer: { id: "1", login: "alice", displayName: "Alice" },
    outgoing: false,
    text: "hey",
    timestamp: 5,
    unread: true,
  });
});

test("conversations put the latest first and count their unread", () => {
  const list = [
    whisper("a1", "a", 1, true),
    whisper("b1", "b", 2),
    whisper("a2", "a", 3, true),
  ];
  const conversations = conversationsOf(list, [peer("a")]);
  expect(conversations.map((c) => [c.peer.id, c.last?.id, c.unread])).toEqual([
    ["a", "a2", 2],
    ["b", "b1", 0],
  ]);
  expect(threadWith(list, "a").map((w) => w.id)).toEqual(["a1", "a2"]);
  expect(countUnread(list)).toBe(2);
});

test("conversations started with no whispers yet are listed first", () => {
  const list = [whisper("b1", "b", 2)];
  expect(
    conversationsOf(list, [peer("c")]).map((c) => [c.peer.id, c.last?.id]),
  ).toEqual([
    ["c", undefined],
    ["b", "b1"],
  ]);
});

test("a whisper shows as a feed message from whoever sent it", () => {
  const me = peer("me");
  const message = feedMessageOf(
    { ...whisper("w", "a", 7), outgoing: true },
    me,
    "#fff",
  );
  expect(message).toMatchObject({
    message_id: "w",
    chatter_user_id: "me",
    chatter_name: "ME",
    color: "#fff",
    fragments: [{ type: "text", text: "w" }],
    timestamp: 7,
  });
});

test("whispers that arrive before the saved ones load are kept once, in time order", () => {
  const saved = [whisper("a", "x", 1), whisper("b", "x", 3)];
  const arrived = [whisper("b", "x", 3), whisper("c", "x", 2)];
  expect(withSaved(saved, arrived).map((w) => w.id)).toEqual(["a", "c", "b"]);
});
