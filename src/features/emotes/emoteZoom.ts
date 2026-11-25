type CdnSizes = { small: RegExp; large: string; fallback: string };

const CDN_SIZES: Record<string, CdnSizes> = {
  twitch: { small: /\/1\.0$/, large: "/3.0", fallback: "/2.0" },
  sevenTv: { small: /\/1x\.webp$/, large: "/4x.webp", fallback: "/2x.webp" },
  betterTtv: { small: /\/1x$/, large: "/3x", fallback: "/2x" },
  frankerFaceZ: { small: /\/1$/, large: "/4", fallback: "/2" },
};

export function zoomUrls(url: string): { large: string; fallback: string } {
  const sizes = Object.values(CDN_SIZES).find(({ small }) => small.test(url));
  if (!sizes) return { large: url, fallback: url };
  return {
    large: url.replace(sizes.small, sizes.large),
    fallback: url.replace(sizes.small, sizes.fallback),
  };
}

export function emoteZoom(url: string) {
  const { large, fallback } = zoomUrls(url);
  if (large === url) return {};
  return { "data-zoom-src": large, "data-zoom-fallback": fallback };
}

const density = (times: number, scale: number) =>
  `${Number((times / scale).toFixed(3))}x`;

export function emoteSrcset(url: string, scale = 1): string | undefined {
  const { large, fallback } = zoomUrls(url);
  if (large === url) return undefined;
  return [
    `${url} ${density(1, scale)}`,
    `${fallback} ${density(2, scale)}`,
    `${large} ${density(3, scale)}`,
  ].join(", ");
}
