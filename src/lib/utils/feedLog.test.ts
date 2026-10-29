import { expect, test } from "vite-plus/test";
import type { FeedEntry } from "../types/index.ts";
import { cursorAt, fromLog, toLogEntry } from "./feedLog.ts";

const message = {
  kind: "message",
  message_id: "m1",
  timestamp: 5,
} as unknown as FeedEntry;
const event = {
  kind: "event",
  id: "e1",
  timestamp: 6,
} as unknown as FeedEntry;

test("an entry survives the log", () => {
  const logged = [message, event].map(toLogEntry);
  expect(logged.map((l) => [l.id, l.timestamp])).toStrictEqual([
    ["m1", 5],
    ["e1", 6],
  ]);
  expect(fromLog(logged.map((l) => l.entry))).toStrictEqual([message, event]);
});

test("lines that are not feed entries are dropped", () => {
  expect(
    fromLog([
      "{not json",
      '{"kind":"message","timestamp":1}',
      '{"kind":"other","id":"x","timestamp":1}',
      "null",
    ]),
  ).toStrictEqual([]);
});

test("a cursor names its entry by id and moment", () => {
  expect(cursorAt("before", message)).toStrictEqual({
    side: "before",
    id: "m1",
    timestamp: 5,
  });
  expect(cursorAt("after", event)).toStrictEqual({
    side: "after",
    id: "e1",
    timestamp: 6,
  });
});
