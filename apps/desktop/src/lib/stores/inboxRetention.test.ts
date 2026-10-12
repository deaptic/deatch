/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { fresh, MAX_AGE_MS, msUntilNextExpiry } from "./inboxRetention.ts";

const now = 1_000_000_000_000;

Deno.test("fresh keeps mentions younger than a week", () => {
  const list = [
    { id: "new", timestamp: now - 1 },
    { id: "edge", timestamp: now - MAX_AGE_MS },
    { id: "old", timestamp: now - MAX_AGE_MS - 1 },
  ];
  assertEquals(fresh(list, now).map((m) => m.id), ["new"]);
});

Deno.test("msUntilNextExpiry follows the oldest mention", () => {
  assertEquals(msUntilNextExpiry([], now), null);
  const list = [{ timestamp: now - 1000 }, { timestamp: now - 5000 }];
  assertEquals(msUntilNextExpiry(list, now), MAX_AGE_MS - 5000);
  assertEquals(
    msUntilNextExpiry([{ timestamp: now - MAX_AGE_MS * 2 }], now),
    0,
  );
});
