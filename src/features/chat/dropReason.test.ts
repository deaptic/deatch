import { expect, test } from "vite-plus/test";
import { dropMessage } from "./dropReason.ts";

test("explains a known drop code", () => {
  expect(dropMessage({ code: "duplicate" })).toBe("You just sent that");
});

test("keeps Twitch's text for an unknown code", () => {
  expect(dropMessage({ code: "unknown", message: "new rule" })).toBe(
    "new rule",
  );
});

test("falls back when Twitch gives no reason", () => {
  expect(dropMessage(null)).toBe("Message not sent");
});
