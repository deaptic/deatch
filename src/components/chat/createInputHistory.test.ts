import { expect, test } from "vite-plus/test";
import { createInputHistory } from "./createInputHistory.ts";

test("steps through history and restores the draft", () => {
  let value = "draft";
  const h = createInputHistory({
    history: () => ["newest", "older"],
    value: () => value,
    setValue: (v) => (value = v),
  });
  expect(h.step(-1)).toBe(false);
  expect(h.step(1)).toBe(true);
  expect(value).toBe("newest");
  expect(h.step(1)).toBe(true);
  expect(value).toBe("older");
  expect(h.step(1)).toBe(false);
  h.step(-1);
  h.step(-1);
  expect(value).toBe("draft");
});

test("does nothing with an empty history", () => {
  const h = createInputHistory({
    history: () => [],
    value: () => "x",
    setValue: () => {
      throw new Error("must not write");
    },
  });
  expect(h.step(1)).toBe(false);
});
