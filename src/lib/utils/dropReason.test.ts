import { expect, test } from "vite-plus/test";
import { dropMessage } from "./dropReason.ts";

test("explains a known drop code", () => {
  expect(dropMessage({ code: "duplicate" })).toStrictEqual(
    "Your message is identical to the one you just sent",
  );
});

test("keeps Twitch's text for an unknown code", () => {
  expect(dropMessage({ code: "unknown", message: "new rule" })).toStrictEqual(
    "new rule",
  );
});

test("falls back when Twitch gives no reason", () => {
  expect(dropMessage(null)).toStrictEqual("Message dropped");
});
