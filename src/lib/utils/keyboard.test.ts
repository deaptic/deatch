/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { comboFor, keyLabels } from "./keyboard.ts";

const key = (init: Partial<KeyboardEvent>) =>
  ({
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...init,
  }) as KeyboardEvent;

Deno.test("orders modifiers ctrl, alt, shift, meta before the key", () => {
  assertEquals(
    comboFor(key({ key: "K", metaKey: true, shiftKey: true, ctrlKey: true })),
    "ctrl-shift-meta-k",
  );
});

Deno.test("drops the arrow prefix and lowercases keys", () => {
  assertEquals(comboFor(key({ key: "ArrowUp", altKey: true })), "alt-up");
  assertEquals(comboFor(key({ key: "Enter" })), "enter");
});

Deno.test("labels each key of a combo for display", () => {
  assertEquals(keyLabels("ctrl-shift-e"), ["Ctrl", "Shift", "E"]);
  assertEquals(keyLabels("alt-up"), ["Alt", "↑"]);
  assertEquals(keyLabels("enter"), ["Enter"]);
  assertEquals(keyLabels("ctrl-,"), ["Ctrl", ","]);
  assertEquals(keyLabels("ctrl--"), ["Ctrl", "-"]);
  assertEquals(keyLabels("ctrl-shift-tab"), ["Ctrl", "Shift", "Tab"]);
  assertEquals(keyLabels("ctrl-pagedown"), ["Ctrl", "PgDn"]);
});

Deno.test("names page and tab combos the way the keymap writes them", () => {
  assertEquals(
    comboFor(key({ key: "PageDown", ctrlKey: true })),
    "ctrl-pagedown",
  );
  assertEquals(
    comboFor(key({ key: "Tab", ctrlKey: true, shiftKey: true })),
    "ctrl-shift-tab",
  );
});
