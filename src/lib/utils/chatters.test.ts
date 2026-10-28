import { expect, test } from "vite-plus/test";
import type { Chatter } from "../types/index.ts";
import { recordIn } from "./chatters.ts";

const chatter = (id: string, lastSeen: number): Chatter => ({
  id,
  login: id,
  displayName: id,
  color: "",
  lastSeen,
});

test("an older sighting never replaces a newer one", () => {
  const bucket = new Map<string, Chatter>();
  recordIn(bucket, chatter("a", 5));
  recordIn(bucket, chatter("a", 3));
  expect(bucket.get("a")?.lastSeen).toBe(5);
});

test("an overflowing bucket keeps its most recent thousand", () => {
  const bucket = new Map<string, Chatter>();
  for (let i = 0; i <= 1200; i++) recordIn(bucket, chatter(`c${i}`, i));
  expect(bucket.size).toBe(1000);
  expect(bucket.has("c1200")).toBe(true);
  expect(bucket.has("c200")).toBe(false);
});
