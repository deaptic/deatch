import { expect, test } from "vite-plus/test";
import { eventText, feedEvent, lineOf } from "./feedEvent.ts";

test("copies an event as its author and line", () => {
  const item = feedEvent("sub", "Subscribed at Tier 1", 0, {
    chatter_name: "Viewer",
  });
  expect(eventText(item)).toBe("Viewer: Subscribed at Tier 1");
});

test("copies what the author said when there is no line", () => {
  const item = feedEvent("announcement", "", 0, {
    chatter_name: "Viewer",
    message: [{ type: "text", text: "hello" }],
  });
  expect(eventText(item)).toBe("Viewer: hello");
});

test("copies only the line when no one did it", () => {
  expect(eventText(feedEvent("local", "Connected to chat", 0))).toBe(
    "Connected to chat",
  );
});

test("drops a leading author name from an older line", () => {
  const old = feedEvent("sub", "Viewer subscribed at Tier 1!", 0, {
    chatter_name: "Viewer",
  });
  expect(lineOf(old)).toBe("Subscribed at Tier 1!");
  const current = feedEvent("sub", "Subscribed at Tier 1", 0, {
    chatter_name: "Viewer",
  });
  expect(lineOf(current)).toBe("Subscribed at Tier 1");
});

test("copies the extras after the line", () => {
  const item = feedEvent(
    "resub",
    { text: "Resubscribed with Prime (8 months)", detail: "note" },
    0,
    {
      chatter_name: "Viewer",
      message: [{ type: "text", text: "hello" }],
      recipients: [{ login: "a", name: "A" }],
    },
  );
  expect(eventText(item)).toBe(
    "Viewer: Resubscribed with Prime (8 months) · hello · note · A",
  );
});
