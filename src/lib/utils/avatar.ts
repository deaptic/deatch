const SIZE_SUFFIX = /\d+x\d+(\.\w+)$/;

export function sizedAvatarUrl(url: string, px: number): string {
  return url.replace(SIZE_SUFFIX, `${px}x${px}$1`);
}
