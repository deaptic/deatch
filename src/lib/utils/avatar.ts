const SIZE_SUFFIX = /\d+x\d+(\.\w+)$/;

export function sizedAvatarUrl(url: string, px: number): string {
  return url.replace(SIZE_SUFFIX, `${px}x${px}$1`);
}

/// Ctrl+hover zoom attributes: 600px where Twitch has it, else 300px.
export function avatarZoom(url: string) {
  return {
    "data-zoom-src": sizedAvatarUrl(url, 600),
    "data-zoom-fallback": sizedAvatarUrl(url, 300),
  };
}
