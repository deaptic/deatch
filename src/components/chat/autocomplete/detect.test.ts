import { expect, test } from "vite-plus/test";
import { detect } from "./detect.ts";

test("detects commands only at the start", () => {
  expect(detect("/ba")).toStrictEqual({ kind: "command", query: "ba" });
  expect(detect("/")).toStrictEqual({ kind: "command", query: "" });
  expect(detect("hi /ba")).toBeNull();
});

test("detects emotes and mentions after whitespace", () => {
  expect(detect("lol :Kap")).toStrictEqual({ kind: "emote", query: "Kap" });
  expect(detect(":")).toBeNull();
  expect(detect("hey @bo")).toStrictEqual({ kind: "mention", query: "bo" });
  expect(detect("mail@bo")).toBeNull();
});
