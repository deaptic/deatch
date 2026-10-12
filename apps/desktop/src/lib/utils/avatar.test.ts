/// <reference lib="deno.ns" />
import { assertEquals } from "@std/assert";
import { sizedAvatarUrl } from "./avatar.ts";

Deno.test("sizedAvatarUrl swaps the size suffix of a Twitch profile image", () => {
  assertEquals(
    sizedAvatarUrl(
      "https://static-cdn.jtvnw.net/jtv_user_pictures/abc-profile_image-300x300.png",
      70,
    ),
    "https://static-cdn.jtvnw.net/jtv_user_pictures/abc-profile_image-70x70.png",
  );
  assertEquals(
    sizedAvatarUrl("https://example.com/a.png", 70),
    "https://example.com/a.png",
  );
});
