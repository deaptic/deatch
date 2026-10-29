import { createRoot, createSignal } from "solid-js";
import { expect, test, vi } from "vite-plus/test";
import { createDebounced } from "./createDebounced.ts";

test("holds a change until the source settles", async () => {
  vi.useFakeTimers();
  const [source, setSource] = createSignal(0);
  const settled = createRoot(() => createDebounced(source, 100));
  setSource(1);
  await vi.advanceTimersByTimeAsync(50);
  setSource(2);
  await vi.advanceTimersByTimeAsync(50);
  expect(settled()).toBe(0);
  await vi.advanceTimersByTimeAsync(100);
  expect(settled()).toBe(2);
  vi.useRealTimers();
});

test("lets an immediate change through at once", async () => {
  vi.useFakeTimers();
  const [source, setSource] = createSignal(0);
  const settled = createRoot(() =>
    createDebounced(source, 100, { immediate: (next) => next < 0 }),
  );
  setSource(-1);
  await vi.advanceTimersByTimeAsync(0);
  expect(settled()).toBe(-1);
  vi.useRealTimers();
});
