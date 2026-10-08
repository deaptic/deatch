/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { completions } from "./usernameCompletion.ts";

const chatters = [
  { login: "kaz_jp", displayName: "カズ", lastSeen: 2 },
  { login: "kazoo", displayName: "Kazoo", lastSeen: 3 },
  { login: "bob", displayName: "Bob", lastSeen: 1 },
];

Deno.test("completes by login or display name, newest first", () => {
  assertEquals(completions(chatters, "KA"), ["Kazoo", "kaz_jp"]);
  assertEquals(completions(chatters, "カ"), ["kaz_jp"]);
  assertEquals(completions(chatters, "zzz"), []);
});
