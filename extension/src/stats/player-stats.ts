import {
  asRecord,
  isFiniteNumber,
  positiveNumber,
  wholeNumber,
} from "../shared/record.ts";

export type PlayerStats = {
  latency: number;
  buffer: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  bitrate: number | null;
  dropped: number | null;
  rate: number | null;
};

const MAX_LATENCY_S = 180;
const CATCH_UP_RATE = 1.01;

export function readStats(value: unknown): PlayerStats | null {
  const stats = asRecord(value);
  const { latency } = stats;
  if (!isFiniteNumber(latency) || latency < 0 || latency > MAX_LATENCY_S) {
    return null;
  }
  return {
    latency,
    buffer:
      isFiniteNumber(stats.buffer) && stats.buffer >= 0 ? stats.buffer : null,
    width: positiveNumber(stats.width),
    height: positiveNumber(stats.height),
    fps: positiveNumber(stats.fps),
    bitrate: positiveNumber(stats.bitrate),
    dropped: wholeNumber(stats.dropped),
    rate: positiveNumber(stats.rate),
  };
}

const formatSeconds = (seconds: number) => `${seconds.toFixed(1)}s`;

export const isCatchingUp = (stats: PlayerStats) =>
  stats.rate !== null && stats.rate > CATCH_UP_RATE;

export type StatKind =
  | "latency"
  | "buffer"
  | "video"
  | "bitrate"
  | "dropped"
  | "catchUp";
export type StatItem = { kind: StatKind; label: string; value: string };

function formatVideo({ height, fps }: PlayerStats): string | null {
  if (height === null) return null;
  return `${height}p${fps === null ? "" : Math.round(fps)}`;
}

function formatBitrate(bitsPerSecond: number): string {
  return bitsPerSecond >= 1_000_000
    ? `${(bitsPerSecond / 1_000_000).toFixed(1)} Mbps`
    : `${Math.round(bitsPerSecond / 1000)} kbps`;
}

export function statItems(stats: PlayerStats): StatItem[] {
  const video = formatVideo(stats);
  const items: (StatItem | null)[] = [
    {
      kind: "latency",
      label: "Latency to broadcaster",
      value: formatSeconds(stats.latency),
    },
    stats.buffer === null
      ? null
      : {
          kind: "buffer",
          label: "Buffered",
          value: formatSeconds(stats.buffer),
        },
    video ? { kind: "video", label: "Video", value: video } : null,
    stats.bitrate === null
      ? null
      : {
          kind: "bitrate",
          label: "Bitrate",
          value: formatBitrate(stats.bitrate),
        },
    stats.dropped
      ? {
          kind: "dropped",
          label: "Dropped frames",
          value: `${stats.dropped} dropped`,
        }
      : null,
    isCatchingUp(stats) && stats.rate !== null
      ? {
          kind: "catchUp",
          label: "Catching up",
          value: `${stats.rate.toFixed(2)}×`,
        }
      : null,
  ];
  return items.filter((item): item is StatItem => item !== null);
}
