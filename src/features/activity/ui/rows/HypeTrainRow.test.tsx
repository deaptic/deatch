// @vitest-environment happy-dom
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, test } from "vite-plus/test";
import HypeTrainRow from "./HypeTrainRow.tsx";

afterEach(cleanup);

test("shows the level and time left", () => {
  const train = {
    id: "h1",
    level: 3,
    progress: 50,
    goal: 100,
    expiresAt: new Date(90_000).toISOString(),
  };
  const view = render(() => <HypeTrainRow train={train} now={0} />);
  expect(view.getByText("Hype Train level 3")).toBeTruthy();
  expect(view.getByText("1:30")).toBeTruthy();
});
