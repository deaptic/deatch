import { expect, test } from "vite-plus/test";
import type { User } from "../../shared/types/index.ts";
import { planState } from "./model.ts";
import { userFromRef } from "../../shared/user.ts";

const user = (login: string): User =>
  userFromRef({ id: login, login, displayName: login });

test("keeps open tabs, fetches new ones and lowercases logins", () => {
  const plan = planState(
    {
      channels: [{ login: "Viewer1", muted: true }, { login: "viewer2" }],
      current: null,
    },
    [user("viewer1"), user("viewer3")],
    null,
  );
  expect(plan.muted).toStrictEqual({ viewer1: true, viewer2: false });
  expect(plan.keep.map((u) => u.login)).toStrictEqual(["viewer1"]);
  expect([...plan.fetch]).toStrictEqual(["viewer2"]);
});

test("looks up a new current tab but not the one already linked", () => {
  const state = { channels: [], current: "Viewer2" };
  expect(planState(state, [], "viewer1").lookUp).toBe("viewer2");
  expect(planState(state, [], "viewer2").lookUp).toBeNull();
});

test("unlinks only when no tab is current and one was linked", () => {
  const state = { channels: [], current: null };
  expect(planState(state, [], "viewer1").unlink).toBe(true);
  expect(planState(state, [], null).unlink).toBe(false);
  expect(
    planState({ channels: [], current: "viewer1" }, [], "viewer2").unlink,
  ).toBe(false);
});
