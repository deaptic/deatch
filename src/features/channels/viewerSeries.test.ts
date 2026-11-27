import { expect, test } from "vite-plus/test";
import { peakViewers, withReading } from "./viewerSeries.ts";

test("a new stream starts a fresh series", () => {
  const first = withReading(null, "s1", 10, 0);
  const next = withReading(first, "s2", 3, 60_000);
  expect(next).toEqual({
    streamId: "s2",
    samples: [{ at: 60_000, viewers: 3 }],
    followersAtStart: null,
  });
});

test("readings of the same stream add up, but not twice within half a minute", () => {
  let series = withReading(null, "s1", 10, 0);
  series = withReading(series, "s1", 12, 10_000);
  series = withReading(series, "s1", 15, 60_000);
  expect(series.samples.map((s) => s.viewers)).toEqual([10, 15]);
  expect(peakViewers(series)).toBe(15);
});
