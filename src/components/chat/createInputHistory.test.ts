import { expect, test } from "vite-plus/test";
import { createInputHistory } from "./createInputHistory.ts";

test("steps through history and restores the draft", () => {
  let value = "draft";
  const h = createInputHistory({
    history: () => ["newest", "older"],
    value: () => value,
    setValue: (v) => (value = v),
  });
  expect(h.step(-1)).toStrictEqual(false);
  expect(h.step(1)).toStrictEqual(true);
  expect(value).toStrictEqual("newest");
  expect(h.step(1)).toStrictEqual(true);
  expect(value).toStrictEqual("older");
  expect(h.step(1)).toStrictEqual(false);
  h.step(-1);
  h.step(-1);
  expect(value).toStrictEqual("draft");
});

test("does nothing with an empty history", () => {
  const h = createInputHistory({
    history: () => [],
    value: () => "x",
    setValue: () => {
      throw new Error("must not write");
    },
  });
  expect(h.step(1)).toStrictEqual(false);
});
