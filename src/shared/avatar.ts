const SIZE_SUFFIX = /\d+x\d+(\.\w+)$/;

export function sizedAvatarUrl(url: string, px: number): string {
  return url.replace(SIZE_SUFFIX, `${px}x${px}$1`);
}

export function avatarZoom(url: string | undefined) {
  if (!url) return undefined;
  return { src: sizedAvatarUrl(url, 600), fallback: sizedAvatarUrl(url, 300) };
}
