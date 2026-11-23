import type { AnnouncementColor } from "./types/index.ts";

export const ANNOUNCEMENT_COLORS = [
  "primary",
  "blue",
  "green",
  "orange",
  "purple",
] as const satisfies readonly AnnouncementColor[];

export function isAnnouncementColor(value: string): value is AnnouncementColor {
  return (ANNOUNCEMENT_COLORS as readonly string[]).includes(value);
}

export const MAX_MESSAGE_LENGTH = 500;

export const AD_LENGTHS = [30, 60, 90, 120, 150, 180] as const;
export const CLIP_LENGTHS = [15, 30, 60] as const;
