import { expect, test } from "vite-plus/test";
import { errorMessage } from "./error.ts";

test("shows Twitch's helix message as-is", () => {
  expect(errorMessage({ kind: "helix", message: "nope" })).toStrictEqual(
    "nope",
  );
});

test("translates other backend error kinds", () => {
  expect(errorMessage({ kind: "notAuthenticated" })).toStrictEqual(
    "Not signed in to Twitch",
  );
  expect(errorMessage({ kind: "http", message: "timed out" })).toStrictEqual(
    "Network request failed",
  );
});

test("falls back for non-backend errors", () => {
  expect(errorMessage(new Error("boom"))).toStrictEqual("boom");
  expect(errorMessage("plain")).toStrictEqual("plain");
  expect(errorMessage(null)).toStrictEqual("null");
});
