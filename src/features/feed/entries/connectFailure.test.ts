import { expect, test } from "vite-plus/test";
import { connectFailure } from "./connectFailure.ts";

test("a rejection shows Twitch's own reason", () => {
  expect(
    connectFailure({ type: "rejected", message: "subscription limit" }),
  ).toBe("Couldn't connect to chat: subscription limit");
});

test("an app error shows its translated message, not its detail", () => {
  expect(
    connectFailure({
      type: "failed",
      error: { kind: "http", message: "tcp reset by peer" },
    }),
  ).toBe("Couldn't connect to chat: Network error. Check your connection.");
});

test("full connections name Twitch's limits", () => {
  expect(
    connectFailure({ type: "capped", connections: 3, perConnection: 300 }),
  ).toBe(
    "Couldn't connect to chat: Twitch allows 3 connections with 300 subscriptions each",
  );
});
