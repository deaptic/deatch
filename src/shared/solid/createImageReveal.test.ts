import { createRoot } from "solid-js";
import { expect, test } from "vite-plus/test";
import { createImageReveal } from "./createImageReveal.ts";

const image = (complete: boolean, naturalWidth: number) =>
  ({ complete, naturalWidth }) as HTMLImageElement;

const settled = () => new Promise<void>((resolve) => queueMicrotask(resolve));

test("an image the browser already has shows at once, without a fade", async () => {
  const reveal = createRoot(() => createImageReveal(() => "a.png"));
  reveal.mount(image(true, 70));
  await settled();
  expect(reveal.loaded()).toBe(true);
  expect(reveal.fade()).not.toContain("transition");
});

test("an image still loading stays hidden until it loads", async () => {
  const reveal = createRoot(() => createImageReveal(() => "a.png"));
  reveal.mount(image(false, 0));
  await settled();
  expect(reveal.loaded()).toBe(false);
  expect(reveal.fade()).toContain("opacity-0");
});
