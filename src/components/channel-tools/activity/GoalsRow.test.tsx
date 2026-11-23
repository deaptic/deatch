// @vitest-environment happy-dom
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, test } from "vite-plus/test";
import GoalsRow from "./GoalsRow.tsx";

afterEach(cleanup);

const goal = (id: string, description: string, current: number) => ({
  id,
  kind: "follow",
  description,
  current,
  target: 100,
});

test("one goal shows its name and progress in the heading", () => {
  const view = render(() => <GoalsRow goals={[goal("g1", "New mic", 42)]} />);
  expect(view.getByText("New mic")).toBeTruthy();
  expect(view.getByText("42 of 100")).toBeTruthy();
});

test("several goals share one heading with a labelled bar each", () => {
  const view = render(() => (
    <GoalsRow goals={[goal("g1", "New mic", 42), goal("g2", "", 7)]} />
  ));
  expect(view.getByText("2 goals")).toBeTruthy();
  expect(view.getByText("New mic")).toBeTruthy();
  expect(view.getByText("Follower goal")).toBeTruthy();
});
