import { expect, test } from "vite-plus/test";
import type { RawGoal } from "../types/twitch/eventsub.ts";
import { goalBegin, goalEnd } from "./goal-message.ts";

const goal = (g: Partial<RawGoal> = {}): RawGoal => ({
  broadcaster_user_id: "1",
  id: "g1",
  type: "subscription_count",
  description: "Road to 100",
  current_amount: 40,
  target_amount: 100,
  ...g,
});

test("describes a new goal with its progress", () => {
  expect(goalBegin(goal())).toStrictEqual({
    text: "New sub goal (40/100)",
    detail: "Road to 100",
  });
  expect(goalBegin(goal({ description: "" }))).toStrictEqual({
    text: "New sub goal (40/100)",
  });
});

test("says whether a goal was achieved", () => {
  expect(
    goalEnd(goal({ is_achieved: true, current_amount: 100 })),
  ).toStrictEqual({
    text: "Sub goal achieved (100/100)",
    detail: "Road to 100",
  });
  expect(goalEnd(goal({ is_achieved: false }))).toStrictEqual({
    text: "Sub goal ended (40/100)",
    detail: "Road to 100",
  });
});
