/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawShoutout } from "../types/twitch/eventsub.ts";
import { mapShoutout } from "./shoutout-mapper.ts";

const shoutout: RawShoutout = {
  broadcaster_user_id: "1",
  to_broadcaster_user_id: "9",
  to_broadcaster_user_login: "mira",
  to_broadcaster_user_name: "Mira",
  moderator_user_name: "Mod",
  viewer_count: 120,
  started_at: "2026-10-01T00:00:00Z",
  cooldown_ends_at: "2026-10-01T00:02:00Z",
  target_cooldown_ends_at: "2026-10-01T01:00:00Z",
};

Deno.test("names who shouted out whom, the reach and the cooldowns", () => {
  const item = mapShoutout(shoutout, 0);
  assertEquals(
    item.system_message,
    "Mod gave Mira a shoutout in front of 120 viewers: next shoutout in 2m, Mira again in 1h",
  );
  assertEquals(item.chatter_user_id, "9");
  assertEquals(item.chatter_login, "mira");
});
