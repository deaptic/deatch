import { expect, test } from "vite-plus/test";
import type { User } from "../types/index.ts";
import { planLinkState } from "./linkPlan.ts";
import { userFromRef } from "./knownUsers.ts";

const user = (login: string): User =>
  userFromRef({ id: login, login, displayName: login });

test("keeps open tabs, fetches new ones and lowercases logins", () => {
  const plan = planLinkState(
    {
      channels: [{ login: "Alice", muted: true }, { login: "bob" }],
      current: null,
    },
    [user("alice"), user("carol")],
    null,
  );
  expect(plan.muted).toStrictEqual({ alice: true, bob: false });
  expect(plan.keep.map((u) => u.login)).toStrictEqual(["alice"]);
  expect([...plan.fetch]).toStrictEqual(["bob"]);
});

test("looks up a new current tab but not the one already linked", () => {
  const state = { channels: [], current: "Bob" };
  expect(planLinkState(state, [], "alice").lookUp).toBe("bob");
  expect(planLinkState(state, [], "bob").lookUp).toBeNull();
});

test("unlinks only when no tab is current and one was linked", () => {
  const state = { channels: [], current: null };
  expect(planLinkState(state, [], "alice").unlink).toBe(true);
  expect(planLinkState(state, [], null).unlink).toBe(false);
  expect(
    planLinkState({ channels: [], current: "alice" }, [], "bob").unlink,
  ).toBe(false);
});
