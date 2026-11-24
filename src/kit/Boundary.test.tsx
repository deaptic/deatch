// @vitest-environment happy-dom
import { cleanup, render } from "@solidjs/testing-library";
import { afterEach, expect, test, vi } from "vite-plus/test";
import Boundary from "./Boundary.tsx";
import { toasts } from "./toasts.ts";

afterEach(cleanup);

function Broken(): never {
  throw new Error("boom");
}

test("shows a retryable panel in place of a crashed region", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const view = render(() => (
    <Boundary label="Feed crashed">
      <Broken />
    </Boundary>
  ));
  expect(view.getByText("Feed crashed")).toBeTruthy();
  expect(view.getByText("boom")).toBeTruthy();
});

test("a silent region disappears and raises a toast instead", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const before = toasts().length;
  const view = render(() => (
    <Boundary silent>
      <Broken />
    </Boundary>
  ));
  expect(view.container.textContent).toBe("");
  expect(toasts().length).toBe(before + 1);
});
