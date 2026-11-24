import {
  clampControl,
  COMPRESSOR_CONTROLS,
  type CompressorSettings,
  DEFAULT_COMPRESSOR,
  MAX_CHANNEL_GAIN,
} from "../../../shared/audio.ts";
import { bool, objectOr } from "./read.ts";

export type LinkPreferences = {
  audioLink: boolean;
  compressor: boolean;
  compressorSettings: CompressorSettings;
  channelGains: Record<string, number>;
};

function compressorSettings(raw: unknown): CompressorSettings {
  const stored = objectOr<Record<string, unknown>>(raw) as Record<
    string,
    unknown
  >;
  const out = { ...DEFAULT_COMPRESSOR };
  for (const control of COMPRESSOR_CONTROLS) {
    const value = stored[control];
    if (typeof value === "number" && Number.isFinite(value)) {
      out[control] = clampControl(control, value);
    }
  }
  return out;
}

function channelGains(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, number> = {};
  for (const [login, gain] of Object.entries(raw)) {
    if (typeof gain === "number" && Number.isFinite(gain)) {
      out[login] = Math.round(Math.min(MAX_CHANNEL_GAIN, Math.max(0, gain)));
    }
  }
  return out;
}

export function readLink(
  raw: unknown,
  fallback: LinkPreferences,
): LinkPreferences {
  const stored = objectOr<LinkPreferences>(raw);
  return {
    audioLink: bool(stored.audioLink, fallback.audioLink),
    compressor: bool(stored.compressor, fallback.compressor),
    compressorSettings: compressorSettings(stored.compressorSettings),
    channelGains: channelGains(stored.channelGains),
  };
}
