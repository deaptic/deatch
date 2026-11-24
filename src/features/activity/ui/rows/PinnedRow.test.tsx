// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import { afterEach, expect, test } from "vite-plus/test";
import PinnedRow from "./PinnedRow.tsx";

afterEach(cleanup);

const user = { id: "1", login: "alice", displayName: "Alice" };
const pin = {
  messageId: "m1",
  sender: user,
  pinnedBy: user,
  text: "Hello there",
  endsAt: null,
};

test("shows the pinned message and reports jump and unpin", () => {
  let jumped = 0;
  let unpinned = 0;
  const view = render(() => (
    <PinnedRow
      pin={pin}
      now={0}
      onJump={() => jumped++}
      onUnpin={() => unpinned++}
    />
  ));
  fireEvent.click(view.getByText("Hello there"));
  const [, unpin] = view.getAllByRole("button");
  fireEvent.click(unpin!);
  expect(view.getByText("Alice")).toBeTruthy();
  expect(jumped).toBe(1);
  expect(unpinned).toBe(1);
});
