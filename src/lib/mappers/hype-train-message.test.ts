import { expect, test } from "vite-plus/test";
import type { RawHypeTrain } from "../types/index.ts";
import {
  hypeTrainBegin,
  hypeTrainEnd,
  hypeTrainProgress,
} from "./hype-train-message.ts";

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
    "A Golden Kappa Train has started at level 1!",
  );
});

test("speaks up only on a new level", () => {
  expect(hypeTrainProgress(train(), 2)).toBeNull();
  expect(hypeTrainProgress(train(), 1)).toBe("The Hype Train reached level 2!");
});

test("credits the top contributors at the end", () => {
  expect(
    hypeTrainEnd(
      train({
        top_contributions: [
          { user_name: "Foo", type: "bits", total: 500 },
          { user_name: "Bar", type: "subscription", total: 1000 },
        ],
      }),
    ),
  ).toStrictEqual({
    text: "The Hype Train ended at level 2 with 1,500 points",
    detail: "Top contributors: Foo (500 bits) and Bar (1,000 sub points)",
  });
  expect(hypeTrainEnd(train())).toStrictEqual({
    text: "The Hype Train ended at level 2 with 1,500 points",
  });
});
