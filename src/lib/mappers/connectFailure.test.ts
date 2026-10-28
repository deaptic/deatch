import { expect, test } from "vite-plus/test";
import { connectFailure } from "./connectFailure.ts";

test("a rejection shows Twitch's own reason", () => {
  expect(
    connectFailure({ type: "rejected", message: "subscription limit" }),
  ).toBe("Failed to connect to chat: subscription limit");
});

test("an app error shows its translated message, not its detail", () => {
  expect(
    connectFailure({
      type: "failed",
      error: { kind: "http", message: "tcp reset by peer" },
    }),
  ).toBe("Failed to connect to chat: Network request failed");
});

test("full connections name Twitch's limits", () => {
  expect(
    connectFailure({ type: "capped", connections: 3, perConnection: 300 }),
  ).toBe(
    "Failed to connect to chat: Twitch allows 3 connections of 300 subscriptions",
  );
});
