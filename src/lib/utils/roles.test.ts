import { expect, test } from "vite-plus/test";
import { allows, meets, roleOf } from "./roles.ts";

test("your own channel makes you its broadcaster, a moderated one its moderator", () => {
  const moderated = new Set(["2"]);
  expect(roleOf("1", "1", moderated)).toBe("broadcaster");
  expect(roleOf("2", "1", moderated)).toBe("moderator");
  expect(roleOf("3", "1", moderated)).toBe("everyone");
  expect(roleOf("1", undefined, moderated)).toBe("everyone");
});

test("higher roles include everything lower roles can do", () => {
  expect(meets("broadcaster", "moderator")).toBe(true);
  expect(meets("moderator", "broadcaster")).toBe(false);
  expect(meets("everyone", "everyone")).toBe(true);
});

test("owner-only capabilities stay with the broadcaster", () => {
  expect(allows("moderator", "moderate")).toBe(true);
  expect(allows("moderator", "manageRoles")).toBe(false);
  expect(allows("moderator", "viewBans")).toBe(false);
  expect(allows("broadcaster", "viewSubscriptions")).toBe(true);
  expect(allows("everyone", "moderate")).toBe(false);
});
