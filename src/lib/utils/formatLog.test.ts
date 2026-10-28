import { expect, test } from "vite-plus/test";
import { formatLog } from "./formatLog.ts";

test("joins strings and serializes objects", () => {
  expect(
    formatLog(["[cmd] getUsers failed", { kind: "http", message: "timeout" }]),
  ).toBe('[cmd] getUsers failed {"kind":"http","message":"timeout"}');
});

test("prints errors with their stack", () => {
  expect(formatLog([new Error("boom")])).toContain("Error: boom");
});

test("keeps nested errors readable", () => {
  expect(formatLog([{ error: new TypeError("bad") }])).toBe(
    '{"error":{"name":"TypeError","message":"bad"}}',
  );
});

test("marks circular references", () => {
  const value: Record<string, unknown> = { name: "loop" };
  value.self = value;
  expect(formatLog([value])).toBe('{"name":"loop","self":"[Circular]"}');
});

test("prints a shared object each time it appears", () => {
  const shared = { id: 1 };
  expect(formatLog([{ a: shared, b: shared }])).toBe(
    '{"a":{"id":1},"b":{"id":1}}',
  );
});

test("prints bigints", () => {
  expect(formatLog([{ total: 12n }])).toBe('{"total":"12n"}');
});

test("names values that cannot be serialized", () => {
  class Broken {
    toJSON(): never {
      throw new Error("no");
    }
  }
  expect(formatLog([new Broken()])).toBe("[unserializable Broken]");
});

test("prints undefined", () => {
  expect(formatLog(["value", undefined])).toBe("value undefined");
});
