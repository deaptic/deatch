/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
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

Deno.test("shows a celebration with its emote", () => {
  const item = mapBitsUse(
    use({
      power_up: { type: "celebration", emote: { id: "e1", name: "Kappa" } },
    }),
    0,
  );
  assertEquals(
    item?.system_message,
    "Foo used 500 bits on an On-Screen Celebration",
  );
  assertEquals(item?.message, [{ type: "emote", text: "Kappa", id: "e1" }]);
});

Deno.test("names a custom Power-up", () => {
  assertEquals(
    mapBitsUse(
      use({ type: "custom_power_up", custom_power_up: { title: "Hydrate" } }),
      0,
    )?.system_message,
    "Foo used 500 bits on Hydrate",
  );
});

Deno.test("leaves cheers and message Power-ups to their chat message", () => {
  assertEquals(mapBitsUse(use({ type: "cheer" }), 0), null);
  assertEquals(
    mapBitsUse(
      use({ power_up: { type: "gigantify_an_emote", emote: null } }),
      0,
    ),
    null,
  );
});
