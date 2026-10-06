/// <reference lib="deno.ns" />
import { assertEquals, assertStringIncludes } from "@std/assert";
import { formatLog } from "./formatLog.ts";

Deno.test("joins strings and serializes objects", () => {
  assertEquals(
    formatLog(["[cmd] getUsers failed", { kind: "http", message: "timeout" }]),
    '[cmd] getUsers failed {"kind":"http","message":"timeout"}',
  );
});

Deno.test("prints errors with their stack", () => {
  assertStringIncludes(formatLog([new Error("boom")]), "Error: boom");
});

Deno.test("keeps nested errors readable", () => {
  assertEquals(
    formatLog([{ error: new TypeError("bad") }]),
    '{"error":{"name":"TypeError","message":"bad"}}',
  );
});

Deno.test("survives circular values", () => {
  const value: Record<string, unknown> = {};
  value.self = value;
  assertEquals(formatLog([value]), "[object Object]");
});

Deno.test("prints undefined", () => {
  assertEquals(formatLog(["value", undefined]), "value undefined");
});
