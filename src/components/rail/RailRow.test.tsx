// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { afterEach, expect, test, vi } from "vite-plus/test";
import RailRow from "./RailRow.tsx";

afterEach(cleanup);

test("builds the hover card only when it is shown", () => {
  const card = vi.fn(() => <span>card</span>);
  const view = render(() => (
    <RailRow label="viewer1" card={card}>
      <span />
    </RailRow>
  ));
  const row = view.getByRole("button");
  expect(card).not.toHaveBeenCalled();
  fireEvent.mouseEnter(row);
  expect(card).toHaveBeenCalledTimes(1);
  fireEvent.mouseLeave(row);
  fireEvent.mouseEnter(row);
  expect(card).toHaveBeenCalledTimes(2);
});
