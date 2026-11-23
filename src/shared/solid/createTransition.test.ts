import { createRoot, createSignal } from "solid-js";
import { expect, test } from "vite-plus/test";
import { createTransition } from "./createTransition.ts";

function setup() {
  const [source, setSource] = createSignal<string | null>("a");
  let finish = () => {};
  const presence = createRoot(() =>
    createTransition(source, () => new Promise<void>((r) => (finish = r))),
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

test("a value that appears before the first check still shows", () => {
  const [source, setSource] = createSignal<string | null>(null);
  const presence = createRoot(() => {
    const created = createTransition(source, () => Promise.resolve());
    setSource("a");
    return created;
  });
  expect(presence.value()).toBe("a");
});
