import { expect, test } from "vite-plus/test";
import { countUnread, fresh, MAX_AGE_MS, msUntilNextExpiry } from "./model.ts";

const now = 1_000_000_000_000;

test("fresh keeps mentions younger than a week", () => {
  const list = [
    { id: "new", timestamp: now - 1 },
    { id: "edge", timestamp: now - MAX_AGE_MS },
    { id: "old", timestamp: now - MAX_AGE_MS - 1 },
  ];
  expect(fresh(list, now).map((m) => m.id)).toStrictEqual(["new"]);
});

test("msUntilNextExpiry follows the oldest mention", () => {
  expect(msUntilNextExpiry([], now)).toBeNull();
  const list = [{ timestamp: now - 1000 }, { timestamp: now - 5000 }];
  expect(msUntilNextExpiry(list, now)).toStrictEqual(MAX_AGE_MS - 5000);
  expect(msUntilNextExpiry([{ timestamp: now - MAX_AGE_MS * 2 }], now)).toBe(0);
});

test("counts unread mentions, optionally in one channel", () => {
  const list = [
    { unread: true, broadcasterId: "a" },
    { unread: true, broadcasterId: "b" },
    { unread: false, broadcasterId: "a" },
  ];
  expect(countUnread(list)).toBe(2);
  expect(countUnread(list, "a")).toBe(1);
});
