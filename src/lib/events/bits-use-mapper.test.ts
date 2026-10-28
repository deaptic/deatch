import { expect, test } from "vite-plus/test";
import type { RawBitsUse } from "../types/twitch/eventsub.ts";
import { mapBitsUse } from "./bits-use-mapper.ts";

const use = (u: Partial<RawBitsUse>): RawBitsUse => ({
  broadcaster_user_id: "1",
  user_id: "2",
  user_login: "foo",
  user_name: "Foo",
  bits: 500,
  type: "power_up",
  power_up: null,
  message: null,
  ...u,
});

test("shows a celebration with its emote", () => {
  const item = mapBitsUse(
    use({
      power_up: { type: "celebration", emote: { id: "e1", name: "Kappa" } },
    }),
    0,
  );
  expect(item?.system_message).toBe(
    "Foo used 500 bits on an On-Screen Celebration",
  );
  expect(item?.message).toStrictEqual([
    { type: "emote", text: "Kappa", id: "e1" },
  ]);
});

test("names a custom Power-up", () => {
  expect(
    mapBitsUse(
      use({ type: "custom_power_up", custom_power_up: { title: "Hydrate" } }),
      0,
    )?.system_message,
  ).toBe("Foo used 500 bits on Hydrate");
});

test("leaves cheers and message Power-ups to their chat message", () => {
  expect(mapBitsUse(use({ type: "cheer" }), 0)).toBeNull();
  expect(
    mapBitsUse(
      use({ power_up: { type: "gigantify_an_emote", emote: null } }),
      0,
    ),
  ).toBeNull();
});
