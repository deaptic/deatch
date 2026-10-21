/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { dropMessage } from "./dropReason.ts";

Deno.test("explains a known drop code", () => {
  assertEquals(
    dropMessage({ code: "duplicate" }),
    "Your message is identical to the one you just sent",
  );
});

Deno.test("keeps Twitch's text for an unknown code", () => {
  assertEquals(
    dropMessage({ code: "unknown", message: "new rule" }),
    "new rule",
  );
});

Deno.test("falls back when Twitch gives no reason", () => {
  assertEquals(dropMessage(null), "Message dropped");
});
