type CdnSizes = { small: RegExp; large: string; fallback: string };

const CDN_SIZES: Record<string, CdnSizes> = {
  twitch: { small: /\/1\.0$/, large: "/3.0", fallback: "/2.0" },
  sevenTv: { small: /\/1x\.webp$/, large: "/4x.webp", fallback: "/2x.webp" },
  betterTtv: { small: /\/1x$/, large: "/3x", fallback: "/2x" },
  frankerFaceZ: { small: /\/1$/, large: "/4", fallback: "/2" },
};

export function emoteZoom(url: string) {
  const sizes = Object.values(CDN_SIZES).find(({ small }) => small.test(url));
  if (!sizes) return {};
  return {
    "data-zoom-src": url.replace(sizes.small, sizes.large),
    "data-zoom-fallback": url.replace(sizes.small, sizes.fallback),
  };
}
