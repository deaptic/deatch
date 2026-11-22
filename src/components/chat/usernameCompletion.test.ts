import { expect, test } from "vite-plus/test";
import { completions } from "./usernameCompletion.ts";

const chatters = [
  { login: "viewer_jp", displayName: "視聴者", lastSeen: 2 },
  { login: "viewer1", displayName: "Viewer1", lastSeen: 3 },
  { login: "broadcaster", displayName: "Broadcaster", lastSeen: 1 },
];

test("completes by login or display name, newest first", () => {
  expect(completions(chatters, "VIEW")).toStrictEqual(["Viewer1", "viewer_jp"]);
  expect(completions(chatters, "視")).toStrictEqual(["viewer_jp"]);
  expect(completions(chatters, "zzz")).toStrictEqual([]);
});
