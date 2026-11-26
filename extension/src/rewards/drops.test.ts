import { expect, test } from "vite-plus/test";
import { earnedDrops } from "./drops.ts";

test("only earned, unclaimed drops of live campaigns are claimed", () => {
  const drop = (
    id: string | null,
    isClaimed: boolean,
    hasPreconditionsMet: boolean,
  ) => ({
    self: { dropInstanceID: id, isClaimed, hasPreconditionsMet },
  });
  expect(
    earnedDrops([
      {
        status: "ACTIVE",
        timeBasedDrops: [
          drop("ready", false, true),
          drop("claimed", true, true),
          drop("locked", false, false),
          drop(null, false, true),
          { self: null },
        ],
      },
      { status: "EXPIRED", timeBasedDrops: [drop("expired", false, true)] },
      { status: "ACTIVE" },
    ]),
  ).toEqual(["ready"]);
  expect(earnedDrops(null)).toEqual([]);
});
