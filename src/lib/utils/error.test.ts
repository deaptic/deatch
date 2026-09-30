/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { errorMessage } from "./error.ts";

Deno.test("reads the message out of each backend error kind", () => {
  assertEquals(
    errorMessage({ kind: "notAuthenticated" }),
    "Not signed in to Twitch",
  );
  assertEquals(
    errorMessage({ kind: "helix", message: { status: 403, message: "nope" } }),
    "nope",
  );
  assertEquals(
    errorMessage({ kind: "http", message: "timed out" }),
    "timed out",
  );
});

Deno.test("falls back for non-backend errors", () => {
  assertEquals(errorMessage(new Error("boom")), "boom");
  assertEquals(errorMessage("plain"), "plain");
  assertEquals(errorMessage(null), "null");
});
