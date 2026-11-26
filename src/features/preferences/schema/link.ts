import {
  clampControl,
  COMPRESSOR_CONTROLS,
  type CompressorSettings,
  DEFAULT_COMPRESSOR,
  MAX_CHANNEL_GAIN,
} from "../../../shared/audio.ts";
import { bool, custom, numberMap, object, type Value } from "./fields.ts";

const compressorSettings = custom<CompressorSettings>(
  () => ({ ...DEFAULT_COMPRESSOR }),
  (raw, fallback) => {
    const out = fallback();
    if (!raw || typeof raw !== "object") return out;
    const stored = raw as Record<string, unknown>;
    for (const control of COMPRESSOR_CONTROLS) {
      const value = stored[control];
      if (typeof value === "number" && Number.isFinite(value)) {
        out[control] = clampControl(control, value);
      }
    }
    return out;
  },
);

export const LINK = object({
  enabled: bool(true),
  audioLink: bool(false),
  compressor: bool(false),
  compressorSettings,
  channelGains: numberMap((gain) =>
    Math.round(Math.min(MAX_CHANNEL_GAIN, Math.max(0, gain))),
  ),
});

export type LinkPreferences = Value<typeof LINK>;
