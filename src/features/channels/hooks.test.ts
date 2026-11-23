import { expect, test, vi } from "vite-plus/test";
import { createHooks } from "./hooks.ts";

test("one failing hook does not stop the others", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const hooks = createHooks();
  const left: string[] = [];
  hooks.add(
    {
      leave: () => {
        throw new Error("boom");
      },
    },
    [],
  );
  hooks.add({ leave: (id) => left.push(id) }, []);
  hooks.run("leave", "a");
  expect(left).toEqual(["a"]);
});

test("late hooks join the channels already joined", () => {
  const hooks = createHooks();
  const joined: string[] = [];
  hooks.add({ join: (id) => joined.push(id) }, ["a", "b"]);
  expect(joined).toEqual(["a", "b"]);
});

test("removed hooks stop running", () => {
  const hooks = createHooks();
  const seen: string[] = [];
  const remove = hooks.add({ focus: (id) => seen.push(id) }, []);
  remove();
  hooks.run("focus", "a");
  expect(seen).toEqual([]);
});
