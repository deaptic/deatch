import { expect, test } from "vite-plus/test";
import { formatUrl } from "./url.ts";

test("shows a link as host and path", () => {
  expect(formatUrl("https://www.twitch.tv/activate?public=true")).toBe(
    "twitch.tv/activate",
  );
  expect(formatUrl("https://twitch.tv/")).toBe("twitch.tv");
});
