import { expect, test } from "vite-plus/test";
import { emoteZoom } from "./emoteZoom.ts";

test("zooms each provider's emote to its largest size", () => {
  expect(
    emoteZoom("https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0"),
  ).toStrictEqual({
    "data-zoom-src":
      "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0",
    "data-zoom-fallback":
      "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0",
  });
  expect(emoteZoom("https://cdn.7tv.app/emote/e1/1x.webp")).toStrictEqual({
    "data-zoom-src": "https://cdn.7tv.app/emote/e1/4x.webp",
    "data-zoom-fallback": "https://cdn.7tv.app/emote/e1/2x.webp",
  });
  expect(emoteZoom("https://cdn.betterttv.net/emote/b1/1x")).toStrictEqual({
    "data-zoom-src": "https://cdn.betterttv.net/emote/b1/3x",
    "data-zoom-fallback": "https://cdn.betterttv.net/emote/b1/2x",
  });
  expect(emoteZoom("https://cdn.frankerfacez.com/emote/123/1")).toStrictEqual({
    "data-zoom-src": "https://cdn.frankerfacez.com/emote/123/4",
    "data-zoom-fallback": "https://cdn.frankerfacez.com/emote/123/2",
  });
});

test("leaves unknown emote URLs without zoom", () => {
  expect(emoteZoom("https://example.com/emoji.png")).toStrictEqual({});
});
