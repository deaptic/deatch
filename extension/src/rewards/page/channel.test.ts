import { expect, test } from "vite-plus/test";
import { readUserId } from "./channel.ts";

test("the channel id comes from the user lookup", () => {
  expect(readUserId({ user: { id: "24138907" } })).toBe("24138907");
  expect(readUserId({ user: null })).toBeNull();
  expect(readUserId(undefined)).toBeNull();
});
