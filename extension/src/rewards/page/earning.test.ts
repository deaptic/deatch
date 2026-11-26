import { expect, test } from "vite-plus/test";
import { readWatchEarned } from "./earning.ts";

const earned = (reason: string) => ({
  type: "points-earned",
  data: {
    timestamp: "2026-11-26T19:13:04Z",
    channel_id: "24138907",
    point_gain: { reason_code: reason },
  },
});

test("only watch-time points mark a channel as earning", () => {
  expect(readWatchEarned(earned("WATCH"))).toEqual({
    channelID: "24138907",
    at: "2026-11-26T19:13:04Z",
  });
  expect(readWatchEarned(earned("CLAIM"))).toBeNull();
  expect(readWatchEarned({ type: "points-earned" })).toBeNull();
});
