import { expect, test } from "vite-plus/test";
import { loginOf, userRefOf } from "./user.ts";

test("a typed name becomes a login", () => {
  expect(loginOf("  @SomeUser ")).toBe("someuser");
});

test("a user narrows to its reference", () => {
  const ref = { id: "1", login: "a", displayName: "A" };
  expect(userRefOf({ ...ref, extra: true } as typeof ref)).toEqual(ref);
});
