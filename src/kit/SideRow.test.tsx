// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { afterEach, expect, test, vi } from "vite-plus/test";
import SideRow from "./SideRow.tsx";

afterEach(cleanup);

test("builds the hover card only when it is shown", () => {
  const card = vi.fn(() => <span>card</span>);
  const view = render(() => (
    <SideRow expanded label="viewer1" card={card}>
      <span />
    </SideRow>
  ));
  const row = view.getByRole("button");
  expect(card).not.toHaveBeenCalled();
  fireEvent.mouseOver(row);
  expect(card).toHaveBeenCalledTimes(1);
  fireEvent.mouseLeave(row);
  fireEvent.mouseOver(row);
  expect(card).toHaveBeenCalledTimes(2);
});

test("leaves the hover card closed while the pointer is on an inner tooltip", () => {
  const card = vi.fn(() => <span>card</span>);
  const view = render(() => (
    <SideRow expanded label="viewer1" card={card}>
      <span data-tip="Mute">mute</span>
    </SideRow>
  ));
  fireEvent.mouseOver(view.getByText("mute"));
  expect(card).not.toHaveBeenCalled();
  fireEvent.mouseOver(view.getByRole("button"));
  expect(card).toHaveBeenCalledTimes(1);
});
