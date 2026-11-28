import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { createSizeWatch } from "./createSizeWatch.ts";

type Notify = (entries: ResizeObserverEntry[]) => void;

let notify: Notify = () => {};
let frames: (() => void)[] = [];

beforeEach(() => {
  frames = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: Notify) {
        notify = callback;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("requestAnimationFrame", (run: () => void) => {
    frames.push(run);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    frames[id - 1] = () => {};
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const entry = (name: string) =>
  ({ target: name }) as unknown as ResizeObserverEntry;

test("resizes are handled on the next frame, all of that frame together", () => {
  const onResize = vi.fn();
  createSizeWatch(onResize);
  notify([entry("a")]);
  notify([entry("b")]);
  expect(onResize).not.toHaveBeenCalled();
  expect(frames).toHaveLength(1);
  frames[0]?.();
  expect(onResize).toHaveBeenCalledWith([entry("a"), entry("b")]);
});

test("nothing runs after disconnect", () => {
  const onResize = vi.fn();
  const watch = createSizeWatch(onResize);
  notify([entry("a")]);
  watch.disconnect();
  frames[0]?.();
  expect(onResize).not.toHaveBeenCalled();
});
