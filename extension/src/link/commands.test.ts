import { expect, test, vi } from "vite-plus/test";
import { createCommandHandler } from "./commands.ts";

function setup() {
  const focus = vi.fn();
  const getState = vi.fn();
  const handle = createCommandHandler({ focus }, { get_state: getState });
  return { focus, getState, handle };
}

test("channel commands run with the channel in lower case", () => {
  const { focus, handle } = setup();
  handle({ type: "focus", channel: "Broadcaster1" });
  expect(focus).toHaveBeenCalledWith({
    type: "focus",
    channel: "broadcaster1",
  });
});

test("commands without a needed channel, unknown or malformed ones are dropped", () => {
  const { focus, getState, handle } = setup();
  handle({ type: "focus" });
  handle({ type: "focus", channel: 7 });
  handle({ type: "toString", channel: "broadcaster1" });
  handle({ type: "nope" });
  handle("focus");
  handle(null);
  expect(focus).not.toHaveBeenCalled();
  expect(getState).not.toHaveBeenCalled();
});

test("browser commands run without a channel", () => {
  const { getState, handle } = setup();
  handle({ type: "get_state" });
  expect(getState).toHaveBeenCalledOnce();
});

test("a failing command is logged instead of left unhandled", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const handle = createCommandHandler(
    { focus: () => Promise.reject(new Error("storage full")) },
    {},
  );
  handle({ type: "focus", channel: "broadcaster1" });
  await vi.waitFor(() =>
    expect(warn).toHaveBeenCalledWith(
      "Deatch Link:",
      "command failed",
      "focus",
      expect.any(Error),
    ),
  );
  warn.mockRestore();
});
