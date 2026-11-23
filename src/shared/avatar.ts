const SIZE_SUFFIX = /\d+x\d+(\.\w+)$/;

export function sizedAvatarUrl(url: string, px: number): string {
  return url.replace(SIZE_SUFFIX, `${px}x${px}$1`);
}

export function avatarZoom(url: string) {
  return {
    "data-zoom-src": sizedAvatarUrl(url, 600),
    "data-zoom-fallback": sizedAvatarUrl(url, 300),
  };
}
