/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import type { RawHypeTrain } from "../types/twitch/eventsub.ts";
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

Deno.test("names the kind of train that started", () => {
  assertEquals(
    hypeTrainBegin(train({ type: "golden_kappa", level: 1 })),
    "A Golden Kappa Train has started at level 1!",
  );
});

Deno.test("speaks up only on a new level", () => {
  assertEquals(hypeTrainProgress(train(), 2), null);
  assertEquals(
    hypeTrainProgress(train(), 1),
    "The Hype Train reached level 2!",
  );
});

Deno.test("credits the top contributors at the end", () => {
  assertEquals(
    hypeTrainEnd(
      train({
        top_contributions: [
          { user_name: "Foo", type: "bits", total: 500 },
          { user_name: "Bar", type: "subscription", total: 1000 },
        ],
      }),
    ),
    {
      text: "The Hype Train ended at level 2 with 1,500 points",
      detail: "Top contributors: Foo (500 bits) and Bar (1,000 sub points)",
    },
  );
  assertEquals(hypeTrainEnd(train()), {
    text: "The Hype Train ended at level 2 with 1,500 points",
  });
});
