import { expect, test } from "vite-plus/test";
import type { Command } from "./types.ts";
import { commandUsage } from "./usage.ts";

const ban: Command = {
  name: "ban",
  description: "COMMAND_BAN",
  role: "mod",
  options: [
    { name: "user", description: "COMMAND_BAN", type: "user", required: true },
    { name: "reason", description: "COMMAND_BAN", type: "string" },
  ],
  execute: () => Promise.resolve(),
};

test("marks only the options a command runs without", () => {
  expect(commandUsage(ban)).toBe("[user] [reason?]");
});

test("a command without options has no usage", () => {
  expect(commandUsage({ ...ban, options: [] })).toBe("");
});
