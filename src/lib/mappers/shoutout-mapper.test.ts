import { expect, test } from "vite-plus/test";
import type { RawShoutout } from "../types/index.ts";
import { mapShoutout } from "./shoutout-mapper.ts";

const shoutout: RawShoutout = {
  broadcaster_user_id: "1",
  to_broadcaster_user_id: "9",
  to_broadcaster_user_login: "mira",
  to_broadcaster_user_name: "Mira",
  moderator_user_id: "2",
  moderator_user_login: "mod",
  moderator_user_name: "Mod",
  viewer_count: 120,
  started_at: "2026-10-01T00:00:00Z",
  cooldown_ends_at: "2026-10-01T00:02:00Z",
  target_cooldown_ends_at: "2026-10-01T01:00:00Z",
};

test("names who shouted out whom, the reach and the cooldowns", () => {
  const item = mapShoutout(shoutout, 0);
  expect(item.system_message).toBe(
    "Mod gave Mira a shoutout in front of 120 viewers",
  );
  expect(item.detail).toBe("Next shoutout in 2m, Mira again in 1h");
  expect(item.chatter_user_id).toBe("9");
  expect(item.chatter_login).toBe("mira");
  expect(item.people).toStrictEqual([{ id: "2", login: "mod", name: "Mod" }]);
});
