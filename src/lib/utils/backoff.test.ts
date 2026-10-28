import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { type Backoff, createBackoff } from "./backoff.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/// The delay before the next scheduled retry runs.
function nextDelay(backoff: Backoff): number {
  const retry = vi.fn();
  const start = Date.now();
  backoff.schedule(retry);
  vi.advanceTimersToNextTimer();
  expect(retry).toHaveBeenCalledOnce();
  return Date.now() - start;
}

test("doubles the delay up to the cap", () => {
  const backoff = createBackoff(100, 300);
  expect([1, 2, 3, 4].map(() => nextDelay(backoff))).toStrictEqual([
    100, 200, 300, 300,
  ]);
});

test("keeps one retry pending at a time", () => {
  const backoff = createBackoff(100, 300);
  const first = vi.fn();
  const second = vi.fn();
  backoff.schedule(first);
  backoff.schedule(second);
  vi.runAllTimers();
  expect(first).toHaveBeenCalledOnce();
  expect(second).not.toHaveBeenCalled();
});

test("a success starts the delay over", () => {
  const backoff = createBackoff(100, 300);
  nextDelay(backoff);
  nextDelay(backoff);
  backoff.succeeded();
  expect(nextDelay(backoff)).toBe(100);
});

test("reset cancels the pending retry and starts over", () => {
  const backoff = createBackoff(100, 300);
  nextDelay(backoff);
  const retry = vi.fn();
  backoff.schedule(retry);
  backoff.reset();
  vi.runAllTimers();
  expect(retry).not.toHaveBeenCalled();
  expect(nextDelay(backoff)).toBe(100);
});
