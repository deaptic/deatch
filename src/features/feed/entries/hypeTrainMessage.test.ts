import { expect, test } from "vite-plus/test";
import type { RawHypeTrain } from "../../../platform/twitch/eventsubPayloads.ts";
import {
  hypeTrainBegin,
  hypeTrainEnd,
  hypeTrainProgress,
} from "./hypeTrainMessage.ts";

const train = (t: Partial<RawHypeTrain> = {}): RawHypeTrain => ({
  broadcaster_user_id: "1",
  id: "h1",
  level: 2,
  total: 1500,
  top_contributions: [],
  type: "regular",
  is_shared_train: false,
  ...t,
});

test("names the kind of train that started", () => {
  expect(hypeTrainBegin(train({ type: "golden_kappa", level: 1 }))).toBe(
    "Golden Kappa Train started at level 1",
  );
});

test("speaks up only on a new level", () => {
  expect(hypeTrainProgress(train(), 2)).toBeNull();
  expect(hypeTrainProgress(train(), 1)).toBe("Reached level 2");
});

test("credits the top contributors at the end", () => {
  expect(
    hypeTrainEnd(
      train({
        top_contributions: [
          {
            user_id: "1",
            user_login: "viewer1",
            user_name: "Viewer1",
            type: "bits",
            total: 500,
          },
          {
            user_id: "2",
            user_login: "viewer2",
            user_name: "Viewer2",
            type: "subscription",
            total: 1000,
          },
        ],
      }),
    ),
  ).toStrictEqual({
    text: "Ended at level 2 (1,500 points)",
    detail:
      "Top contributors: Viewer1 (500 Bits) and Viewer2 (1,000 sub points)",
    people: [
      { id: "1", login: "viewer1", name: "Viewer1" },
      { id: "2", login: "viewer2", name: "Viewer2" },
    ],
  });
  expect(hypeTrainEnd(train())).toStrictEqual({
    text: "Ended at level 2 (1,500 points)",
    people: [],
  });
});
