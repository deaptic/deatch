import { createRoot, createSignal } from "solid-js";
import { expect, test } from "vite-plus/test";
import { createPresence } from "./createPresence.ts";

function setup() {
  const [source, setSource] = createSignal<string | null>("a");
  let finish = () => {};
  const presence = createRoot(() =>
    createPresence(source, () => new Promise<void>((r) => (finish = r))),
  );
  return { setSource, presence, finish: () => finish() };
}

test("keeps the last value until the exit finishes", async () => {
  const { setSource, presence, finish } = setup();
  setSource(null);
  expect(presence.value()).toBe("a");
  expect(presence.closing()).toBe(true);
  finish();
  await Promise.resolve();
  expect(presence.value()).toBeUndefined();
  expect(presence.closing()).toBe(false);
});

test("reopening during the exit keeps it mounted", async () => {
  const { setSource, presence, finish } = setup();
  setSource(null);
  setSource("b");
  finish();
  await Promise.resolve();
  expect(presence.value()).toBe("b");
  expect(presence.closing()).toBe(false);
});
