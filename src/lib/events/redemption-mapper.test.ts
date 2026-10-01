/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawChannelPointsRedemption } from "../types/twitch/eventsub.ts";
import { mapRedemption } from "./redemption-mapper.ts";

const raw = (
  overrides: Partial<RawChannelPointsRedemption> = {},
): RawChannelPointsRedemption => ({
  broadcaster_user_id: "111",
  id: "r1",
  user_id: "222",
  user_login: "foo",
  user_name: "Foo",
  user_input: "",
  status: "unfulfilled",
  reward: { id: "w1", title: "Hydrate", cost: 5000, prompt: "  Drink!  " },
  redeemed_at: "2026-10-01T00:00:00Z",
  ...overrides,
});

Deno.test("keeps the reward and its trimmed prompt", () => {
  assertEquals(mapRedemption(raw()).reward, {
    id: "w1",
    title: "Hydrate",
    prompt: "Drink!",
  });
});

Deno.test("typed input is trimmed and omitted when blank", () => {
  assertEquals(mapRedemption(raw({ user_input: "  pls  " })).input, "pls");
  assertEquals(mapRedemption(raw({ user_input: "   " })).input, undefined);
});
