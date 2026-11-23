import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { createTimeouts } from "./timeouts.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("runs each timeout after its delay", () => {
  const timeouts = createTimeouts();
  const run = vi.fn();
  timeouts.after(100, run);
  vi.advanceTimersByTime(99);
  expect(run).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(run).toHaveBeenCalledOnce();
});

test("cancel stops one timeout", () => {
  const timeouts = createTimeouts();
  const kept = vi.fn();
  const cancelled = vi.fn();
  timeouts.after(100, kept);
  timeouts.cancel(timeouts.after(100, cancelled));
  vi.runAllTimers();
  expect(kept).toHaveBeenCalledOnce();
  expect(cancelled).not.toHaveBeenCalled();
});

test("clear stops every pending timeout", () => {
  const timeouts = createTimeouts();
  const run = vi.fn();
  timeouts.after(100, run);
  timeouts.after(200, run);
  timeouts.clear();
  vi.runAllTimers();
  expect(run).not.toHaveBeenCalled();
});
