import { expect, test } from "vite-plus/test";
import { formatLog } from "./formatLog.ts";

test("joins strings and serializes objects", () => {
  expect(
    formatLog(["[cmd] getUsers failed", { kind: "http", message: "timeout" }]),
  ).toStrictEqual('[cmd] getUsers failed {"kind":"http","message":"timeout"}');
});

test("prints errors with their stack", () => {
  expect(formatLog([new Error("boom")])).toContain("Error: boom");
});

test("keeps nested errors readable", () => {
  expect(formatLog([{ error: new TypeError("bad") }])).toStrictEqual(
    '{"error":{"name":"TypeError","message":"bad"}}',
  );
});

test("survives circular values", () => {
  const value: Record<string, unknown> = {};
  value.self = value;
  expect(formatLog([value])).toBe("[object Object]");
});

test("prints undefined", () => {
  expect(formatLog(["value", undefined])).toBe("value undefined");
});
