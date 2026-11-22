import { expect, test } from "vite-plus/test";
import {
  type MethodSpec,
  methodQueryAt,
  parse,
  problems,
  render,
} from "./triggerTemplate.ts";

const SPECS: MethodSpec[] = [
  { name: "user", arg: "none" },
  { name: "args", arg: "optional", validArg: (a) => /^\d+$/.test(a) },
  { name: "random", arg: "required" },
];

test("splits text and methods with their arguments", () => {
  expect(parse("hi {user}, roll {random:1-6}!")).toStrictEqual([
    { kind: "text", text: "hi " },
    { kind: "method", name: "user", arg: null, raw: "{user}" },
    { kind: "text", text: ", roll " },
    { kind: "method", name: "random", arg: "1-6", raw: "{random:1-6}" },
    { kind: "text", text: "!" },
  ]);
});

test("reports unknown methods and argument mistakes", () => {
  const found = problems(
    parse("{nope} {user:x} {random} {args:two} {args:2} {args}"),
    SPECS,
  );
  expect(found).toStrictEqual([
    { kind: "unknown", raw: "{nope}" },
    { kind: "unexpectedArg", raw: "{user:x}" },
    { kind: "missingArg", raw: "{random}" },
    { kind: "badArg", raw: "{args:two}" },
  ]);
});

test("renders resolved methods and blanks the failing ones", async () => {
  const text = await render(parse("{user} has {count} {broken}"), (name) =>
    name === "broken"
      ? Promise.reject(new Error("boom"))
      : Promise.resolve(name === "user" ? "viewer" : "3"),
  );
  expect(text).toBe("viewer has 3 ");
});

test("finds the method being typed before the caret", () => {
  expect(methodQueryAt("hi {fol", 7)).toStrictEqual({ start: 3, query: "fol" });
  expect(methodQueryAt("hi {", 4)).toStrictEqual({ start: 3, query: "" });
  expect(methodQueryAt("hi {user} x", 11)).toBeNull();
});
