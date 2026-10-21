/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { errorMessage } from "./error.ts";

Deno.test("shows Twitch's helix message as-is", () => {
  assertEquals(errorMessage({ kind: "helix", message: "nope" }), "nope");
});

Deno.test("translates other backend error kinds", () => {
  assertEquals(
    errorMessage({ kind: "notAuthenticated" }),
    "Not signed in to Twitch",
  );
  assertEquals(
    errorMessage({ kind: "http", message: "timed out" }),
    "Network request failed",
  );
});

Deno.test("falls back for non-backend errors", () => {
  assertEquals(errorMessage(new Error("boom")), "boom");
  assertEquals(errorMessage("plain"), "plain");
  assertEquals(errorMessage(null), "null");
});
