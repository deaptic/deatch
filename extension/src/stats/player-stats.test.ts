import { expect, test } from "vite-plus/test";
import { isCatchingUp, readStats, statItems } from "./player-stats.ts";

const raw = {
  latency: 1.84,
  buffer: 2.1,
  width: 1920,
  height: 1080,
  fps: 59.94,
  bitrate: 6_200_000,
  dropped: 3,
  rate: 1,
};

const values = (stats: ReturnType<typeof readStats>) =>
  stats ? statItems(stats).map(({ kind, value }) => [kind, value]) : null;

test("stats keep only values a live player can report", () => {
  expect(readStats({ ...raw, buffer: -1, fps: 0, dropped: "x" })).toMatchObject(
    {
      latency: 1.84,
      buffer: null,
      fps: null,
      dropped: null,
    },
  );
  expect(readStats({ latency: -150 })).toBeNull();
  expect(readStats({ latency: 400 })).toBeNull();
  expect(readStats({ latency: "1.8" })).toBeNull();
});

test("the row shows what the player reports, in a readable form", () => {
  expect(values(readStats(raw))).toEqual([
    ["latency", "1.8s"],
    ["buffer", "2.1s"],
    ["video", "1080p60"],
    ["bitrate", "6.2 Mbps"],
    ["dropped", "3 dropped"],
  ]);
});

test("no dropped frames shows nothing, and catching up shows the speed", () => {
  const stats = readStats({
    latency: 4,
    rate: 1.05,
    bitrate: 850_000,
    dropped: 0,
  });
  expect(stats && isCatchingUp(stats)).toBe(true);
  expect(values(stats)).toEqual([
    ["latency", "4.0s"],
    ["bitrate", "850 kbps"],
    ["catchUp", "1.05×"],
  ]);
});
