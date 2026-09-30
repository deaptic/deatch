/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { comboFor } from "./keyboard.ts";

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
