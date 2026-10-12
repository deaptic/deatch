import { assertEquals, assertThrows } from "@std/assert";
import { twitchClientId } from "./config.ts";

Deno.test("reads the client id", () => {
  assertEquals(twitchClientId({ TWITCH_CLIENT_ID: "id" }), "id");
});

Deno.test("refuses to start without it", () => {
  assertThrows(() => twitchClientId({ TWITCH_CLIENT_ID: "" }));
});
