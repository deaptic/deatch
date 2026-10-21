/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
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

Deno.test("describes a new goal with its progress", () => {
  assertEquals(goalBegin(goal()), "New sub goal (40/100): Road to 100");
  assertEquals(goalBegin(goal({ description: "" })), "New sub goal (40/100)");
});

Deno.test("says whether a goal was achieved", () => {
  assertEquals(
    goalEnd(goal({ is_achieved: true, current_amount: 100 })),
    "Sub goal achieved (100/100): Road to 100",
  );
  assertEquals(
    goalEnd(goal({ is_achieved: false })),
    "Sub goal ended (40/100): Road to 100",
  );
});
