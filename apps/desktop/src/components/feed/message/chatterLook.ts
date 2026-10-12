import type { Palette } from "blobatar";
import * as appearance from "../../../lib/services/appearance.ts";
import { hueOf } from "../../../lib/utils/color.ts";

const VIVID_TONE = 0.7;

export type ChatterLook = {
  tint?: string;
  hue?: number;
  tone?: number;
  palette?: Palette;
};

export function chatterLook(color: string): ChatterLook {
  const hue = hueOf(color);
  if (hue === undefined) {
    return {
      palette: {
        head: appearance.token("color-ink-soft"),
        eye: appearance.token("color-canvas"),
      },
    };
  }
  return { tint: color, hue, tone: VIVID_TONE };
}
