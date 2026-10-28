import { expect, test } from "vite-plus/test";
import { comboFor, keyLabels } from "./keyboard.ts";

const key = (init: Partial<KeyboardEvent>) =>
  ({
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...init,
  }) as KeyboardEvent;

test("orders modifiers ctrl, alt, shift, meta before the key", () => {
  expect(
    comboFor(key({ key: "K", metaKey: true, shiftKey: true, ctrlKey: true })),
  ).toBe("ctrl-shift-meta-k");
});

test("drops the arrow prefix and lowercases keys", () => {
  expect(comboFor(key({ key: "ArrowUp", altKey: true }))).toBe("alt-up");
  expect(comboFor(key({ key: "Enter" }))).toBe("enter");
});

test("labels each key of a combo for display", () => {
  expect(keyLabels("ctrl-shift-e")).toStrictEqual(["Ctrl", "Shift", "E"]);
  expect(keyLabels("alt-up")).toStrictEqual(["Alt", "↑"]);
  expect(keyLabels("enter")).toStrictEqual(["Enter"]);
  expect(keyLabels("ctrl-,")).toStrictEqual(["Ctrl", ","]);
  expect(keyLabels("ctrl--")).toStrictEqual(["Ctrl", "-"]);
  expect(keyLabels("ctrl-shift-tab")).toStrictEqual(["Ctrl", "Shift", "Tab"]);
  expect(keyLabels("ctrl-pagedown")).toStrictEqual(["Ctrl", "PgDn"]);
});

test("names page and tab combos the way the keymap writes them", () => {
  expect(comboFor(key({ key: "PageDown", ctrlKey: true }))).toBe(
    "ctrl-pagedown",
  );
  expect(comboFor(key({ key: "Tab", ctrlKey: true, shiftKey: true }))).toBe(
    "ctrl-shift-tab",
  );
});
