/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { freshEntries, requestsInWindow, sizedAvatarUrl } from "./avatar.ts";

Deno.test("sizedAvatarUrl swaps the size suffix of a Twitch profile image", () => {
  assertEquals(
    sizedAvatarUrl(
      "https://static-cdn.jtvnw.net/jtv_user_pictures/abc-profile_image-300x300.png",
      70,
    ),
    "https://static-cdn.jtvnw.net/jtv_user_pictures/abc-profile_image-70x70.png",
  );
  assertEquals(
    sizedAvatarUrl("https://example.com/a.png", 70),
    "https://example.com/a.png",
  );
});

Deno.test("requestsInWindow keeps only requests inside the window", () => {
  assertEquals(requestsInWindow([0, 30_000, 59_000], 60_000, 60_000), [
    30_000,
    59_000,
  ]);
});

Deno.test("freshEntries drops expired entries and keeps the newest up to max", () => {
  const entries = {
    old: { url: "o", at: 0 },
    a: { url: "a", at: 900 },
    b: { url: "b", at: 950 },
    c: { url: "c", at: 990 },
  };
  assertEquals(Object.keys(freshEntries(entries, 1000, 500, 2)), ["c", "b"]);
});
