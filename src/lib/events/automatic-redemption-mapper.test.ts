import { expect, test } from "vite-plus/test";
import type { RawAutomaticRedemption } from "../types/twitch/eventsub.ts";
import { mapAutomaticRedemption } from "./automatic-redemption-mapper.ts";

const raw = (
  reward: Partial<RawAutomaticRedemption["reward"]>,
): RawAutomaticRedemption => ({
  broadcaster_user_id: "1",
  id: "r1",
  user_id: "2",
  user_login: "foo",
  user_name: "Foo",
  reward: {
    type: "chosen_sub_emote_unlock",
    channel_points: 300,
    emote: null,
    ...reward,
  },
  message: null,
  redeemed_at: "2026-10-01T00:00:00Z",
});

test("names the reward, its cost and the unlocked emote", () => {
  const item = mapAutomaticRedemption(
    raw({ emote: { id: "e1", name: "Kappa" } }),
    0,
  );
  expect(item?.system_message).toStrictEqual(
    "Foo redeemed Choose an Emote to Unlock for 300 points",
  );
  expect(item?.message).toStrictEqual([
    { type: "emote", text: "Kappa", id: "e1" },
  ]);
});

test("leaves message rewards to their chat message", () => {
  expect(
    mapAutomaticRedemption(raw({ type: "send_highlighted_message" }), 0),
  ).toStrictEqual(null);
  expect(
    mapAutomaticRedemption(raw({ type: "gigantify_an_emote" }), 0),
  ).toStrictEqual(null);
});

test("names an On-Screen Celebration", () => {
  expect(
    mapAutomaticRedemption(raw({ type: "celebration" }), 0)?.system_message,
  ).toStrictEqual("Foo redeemed an On-Screen Celebration for 300 points");
});
