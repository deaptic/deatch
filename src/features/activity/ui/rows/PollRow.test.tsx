// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { afterEach, expect, test } from "vite-plus/test";
import PollRow from "./PollRow.tsx";

afterEach(cleanup);

const poll = {
  id: "p1",
  title: "Best snack?",
  endsAt: new Date(60_000).toISOString(),
  choices: [
    { id: "a", title: "Chips", votes: 3 },
    { id: "b", title: "Fruit", votes: 1 },
  ],
};

test("shows the poll and reports when it is ended", () => {
  let ended = 0;
  const view = render(() => (
    <PollRow poll={poll} now={0} onEnd={() => ended++} />
  ));
  expect(view.getByText("Best snack?")).toBeTruthy();
  expect(view.getByText("Chips")).toBeTruthy();
  fireEvent.click(view.getByRole("button"));
  expect(ended).toBe(1);
});
