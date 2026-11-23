export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 25;

const TAG = /^[\p{L}\p{N}]+$/u;

export type TagCheck =
  | { ok: true; tag: string }
  | { ok: false; reason: "format" | "length" | "full" | "duplicate" };

export function checkTag(input: string, current: readonly string[]): TagCheck {
  const tag = input.trim().replace(/^#/, "");
  if (current.length >= MAX_TAGS) return { ok: false, reason: "full" };
  if (!TAG.test(tag)) return { ok: false, reason: "format" };
  if (tag.length > MAX_TAG_LENGTH) return { ok: false, reason: "length" };
  const lower = tag.toLowerCase();
  if (current.some((t) => t.toLowerCase() === lower)) {
    return { ok: false, reason: "duplicate" };
  }
  return { ok: true, tag };
}
