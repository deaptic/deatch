import { expect, test } from "vite-plus/test";
import { sizedAvatarUrl } from "./avatar.ts";

test("sizedAvatarUrl swaps the size suffix of a Twitch profile image", () => {
  expect(
    sizedAvatarUrl(
      "https://static-cdn.jtvnw.net/jtv_user_pictures/abc-profile_image-300x300.png",
      70,
    ),
  ).toStrictEqual(
    "https://static-cdn.jtvnw.net/jtv_user_pictures/abc-profile_image-70x70.png",
  );
  expect(sizedAvatarUrl("https://example.com/a.png", 70)).toStrictEqual(
    "https://example.com/a.png",
  );
});
