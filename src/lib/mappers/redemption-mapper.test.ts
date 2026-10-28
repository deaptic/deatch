import { expect, test } from "vite-plus/test";
import type { RawChannelPointsRedemption } from "../types/index.ts";
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

test("keeps the reward and its trimmed prompt", () => {
  expect(mapRedemption(raw()).reward).toStrictEqual({
    id: "w1",
    title: "Hydrate",
    prompt: "Drink!",
    cost: 5000,
  });
});

test("typed input is trimmed and omitted when blank", () => {
  expect(mapRedemption(raw({ user_input: "  pls  " })).input).toBe("pls");
  expect(mapRedemption(raw({ user_input: "   " })).input).toBeUndefined();
});
