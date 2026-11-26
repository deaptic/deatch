// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import SideRow from "./SideRow.tsx";
import { TOOLTIP_DELAY_MS } from "./tooltipTiming.ts";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const settle = () => vi.advanceTimersByTime(TOOLTIP_DELAY_MS * 2);

test("opens the hover card only after resting on the row", () => {
  const card = vi.fn(() => <span>card</span>);
  const view = render(() => (
    <SideRow expanded label="viewer1" card={card}>
      <span />
    </SideRow>
  ));
  const row = view.getByRole("button");
  fireEvent.mouseOver(row);
  expect(card).not.toHaveBeenCalled();
  vi.advanceTimersByTime(TOOLTIP_DELAY_MS);
  expect(card).toHaveBeenCalledTimes(1);
  fireEvent.mouseLeave(row);
  settle();
  fireEvent.mouseOver(row);
  settle();
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
  settle();
  expect(card).not.toHaveBeenCalled();
  fireEvent.mouseOver(view.getByRole("button"));
  settle();
  expect(card).toHaveBeenCalledTimes(1);
});
