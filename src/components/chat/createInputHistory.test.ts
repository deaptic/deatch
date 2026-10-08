/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { createInputHistory } from "./createInputHistory.ts";

Deno.test("steps through history and restores the draft", () => {
  let value = "draft";
  const h = createInputHistory({
    history: () => ["newest", "older"],
    value: () => value,
    setValue: (v) => (value = v),
  });
  assertEquals(h.step(-1), false);
  assertEquals(h.step(1), true);
  assertEquals(value, "newest");
  assertEquals(h.step(1), true);
  assertEquals(value, "older");
  assertEquals(h.step(1), false);
  h.step(-1);
  h.step(-1);
  assertEquals(value, "draft");
});

Deno.test("does nothing with an empty history", () => {
  const h = createInputHistory({
    history: () => [],
    value: () => "x",
    setValue: () => {
      throw new Error("must not write");
    },
  });
  assertEquals(h.step(1), false);
});
