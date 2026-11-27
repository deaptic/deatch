import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { cached } from "./cache.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const FIVE_MINUTES = 5 * 60 * 1000;

test("reuses a result while it is fresh", async () => {
  const load = vi.fn(() => Promise.resolve(1));
  await cached("fresh", load, 0);
  vi.advanceTimersByTime(FIVE_MINUTES - 1);
  expect(await cached("fresh", load, 0)).toBe(1);
  expect(load).toHaveBeenCalledTimes(1);
});

test("loads again once the result is old", async () => {
  const load = vi.fn(() => Promise.resolve(1));
  await cached("old", load, 0);
  vi.advanceTimersByTime(FIVE_MINUTES);
  await cached("old", load, 0);
  expect(load).toHaveBeenCalledTimes(2);
});

test("gives the fallback on failure and loads again next time", async () => {
  const load = vi
    .fn<() => Promise<number>>()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(2);
  expect(await cached("failed", load, 0)).toBe(0);
  expect(await cached("failed", load, 0)).toBe(2);
});
