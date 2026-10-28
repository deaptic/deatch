import { expect, test } from "vite-plus/test";
import { errorMessage } from "./error.ts";

test("shows Twitch's helix message as-is", () => {
  expect(errorMessage({ kind: "helix", message: "nope" })).toBe("nope");
});

test("translates other backend error kinds", () => {
  expect(errorMessage({ kind: "notAuthenticated" })).toBe(
    "Not signed in to Twitch",
  );
  expect(errorMessage({ kind: "http", message: "timed out" })).toBe(
    "Network request failed",
  );
});

test("falls back for non-backend errors", () => {
  expect(errorMessage(new Error("boom"))).toBe("boom");
  expect(errorMessage("plain")).toBe("plain");
  expect(errorMessage(null)).toBe("null");
});
