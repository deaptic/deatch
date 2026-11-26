import { expect, test } from "vite-plus/test";
import { channelFromUrl } from "./channel.js";

test("only real Twitch channel pages count as channels", () => {
  expect(channelFromUrl("https://www.twitch.tv/Broadcaster1")).toBe(
    "broadcaster1",
  );
  expect(channelFromUrl("https://m.twitch.tv/broadcaster1/videos")).toBe(
    "broadcaster1",
  );
  expect(channelFromUrl("https://mxtwitch.tv/broadcaster1")).toBeNull();
  expect(channelFromUrl("https://twitchxtv/broadcaster1")).toBeNull();
  expect(channelFromUrl("https://www.twitch.tv/directory")).toBeNull();
  expect(channelFromUrl("not a url")).toBeNull();
});
