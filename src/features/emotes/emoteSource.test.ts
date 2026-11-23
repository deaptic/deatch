import { expect, test } from "vite-plus/test";
import { emoteScope, emoteSource } from "./emoteSource.ts";

const SEVEN_TV = "https://cdn.7tv.app/emote/abc123/1x.webp";
const TWITCH = "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0";

test("reads the provider, id and page from each CDN", () => {
  expect(emoteSource(SEVEN_TV)).toStrictEqual({
    provider: "sevenTv",
    id: "abc123",
    page: "https://7tv.app/emotes/abc123",
  });
  expect(emoteSource("https://cdn.betterttv.net/emote/b1/1x")).toStrictEqual({
    provider: "betterTtv",
    id: "b1",
    page: "https://betterttv.com/emotes/b1",
  });
  expect(emoteSource("https://cdn.frankerfacez.com/emote/9/1")).toStrictEqual({
    provider: "frankerFaceZ",
    id: "9",
    page: "https://www.frankerfacez.com/emoticon/9",
  });
  expect(emoteSource(TWITCH)).toStrictEqual({
    provider: "twitch",
    id: "25",
    page: null,
  });
});

test("ignores URLs from anywhere else", () => {
  expect(emoteSource("https://example.com/emote/x/1x")).toBeNull();
  expect(
    emoteSource("https://evil.test/?u=https://cdn.7tv.app/emote/x/1"),
  ).toBeNull();
});

test("tells channel emotes from global ones", () => {
  const known = {
    channelUrls: new Set([SEVEN_TV]),
    globalUrls: new Set<string>(),
    twitchGlobalIds: new Set(["25"]),
  };
  const sevenTv = emoteSource(SEVEN_TV)!;
  const twitch = emoteSource(TWITCH)!;
  expect(emoteScope(sevenTv, SEVEN_TV, known)).toBe("channel");
  expect(emoteScope(twitch, TWITCH, known)).toBe("global");
  expect(
    emoteScope(sevenTv, SEVEN_TV, { ...known, channelUrls: new Set() }),
  ).toBeNull();
});
