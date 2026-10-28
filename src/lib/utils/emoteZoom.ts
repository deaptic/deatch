/// Each provider serves bigger copies of an emote under a size suffix:
/// [smallest served, largest, fallback when the largest is missing].
const SIZES: [RegExp, string, string][] = [
  [/\/1\.0$/, "/3.0", "/2.0"], // Twitch
  [/\/1x\.webp$/, "/4x.webp", "/2x.webp"], // 7TV
  [/\/1x$/, "/3x", "/2x"], // BetterTTV
  [/\/1$/, "/4", "/2"], // FrankerFaceZ
];

/// Ctrl+hover zoom attributes for an emote image; none for unknown URLs.
export function emoteZoom(url: string) {
  const size = SIZES.find(([small]) => small.test(url));
  if (!size) return {};
  const [small, large, fallback] = size;
  return {
    "data-zoom-src": url.replace(small, large),
    "data-zoom-fallback": url.replace(small, fallback),
  };
}
