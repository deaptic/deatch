import { expect, test } from "vite-plus/test";
import { completions } from "./usernameCompletion.ts";

const chatters = [
  { login: "kaz_jp", displayName: "カズ", lastSeen: 2 },
  { login: "kazoo", displayName: "Kazoo", lastSeen: 3 },
  { login: "bob", displayName: "Bob", lastSeen: 1 },
];

test("completes by login or display name, newest first", () => {
  expect(completions(chatters, "KA")).toStrictEqual(["Kazoo", "kaz_jp"]);
  expect(completions(chatters, "カ")).toStrictEqual(["kaz_jp"]);
  expect(completions(chatters, "zzz")).toStrictEqual([]);
});
