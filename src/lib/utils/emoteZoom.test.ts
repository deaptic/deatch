/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { emoteZoom } from "./emoteZoom.ts";

Deno.test("zooms each provider's emote to its largest size", () => {
  assertEquals(
    emoteZoom("https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0"),
    {
      "data-zoom-src":
        "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0",
      "data-zoom-fallback":
        "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0",
    },
  );
  assertEquals(emoteZoom("https://cdn.7tv.app/emote/e1/1x.webp"), {
    "data-zoom-src": "https://cdn.7tv.app/emote/e1/4x.webp",
    "data-zoom-fallback": "https://cdn.7tv.app/emote/e1/2x.webp",
  });
  assertEquals(emoteZoom("https://cdn.betterttv.net/emote/b1/1x"), {
    "data-zoom-src": "https://cdn.betterttv.net/emote/b1/3x",
    "data-zoom-fallback": "https://cdn.betterttv.net/emote/b1/2x",
  });
  assertEquals(emoteZoom("https://cdn.frankerfacez.com/emote/123/1"), {
    "data-zoom-src": "https://cdn.frankerfacez.com/emote/123/4",
    "data-zoom-fallback": "https://cdn.frankerfacez.com/emote/123/2",
  });
});

Deno.test("leaves unknown emote URLs without zoom", () => {
  assertEquals(emoteZoom("https://example.com/emoji.png"), {});
});
