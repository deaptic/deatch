import { expect, test } from "vite-plus/test";
import { runningActivities } from "./running.ts";

const idle = {
  pinned: null,
  shield: false,
  poll: null,
  prediction: null,
  charity: null,
  unbanRequests: [],
  goals: [],
  ads: null,
};

test("nothing runs on an idle channel", () => {
  expect(runningActivities(idle, false)).toEqual([]);
});

test("lists what runs in the strip's order", () => {
  const goal = {
    id: "g",
    kind: "follow",
    description: "",
    current: 1,
    target: 2,
  };
  expect(
    runningActivities({ ...idle, shield: true, goals: [goal] }, true),
  ).toEqual(["shield", "goals", "raid"]);
});
