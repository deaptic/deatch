export type ViewerSample = { at: number; viewers: number };

export type ViewerSeries = {
  streamId: string;
  samples: ViewerSample[];
  followersAtStart: number | null;
};

const MIN_GAP_MS = 30_000;

export function withReading(
  series: ViewerSeries | null,
  streamId: string,
  viewers: number,
  at: number,
): ViewerSeries {
  const sample = { at, viewers };
  if (series?.streamId !== streamId) {
    return { streamId, samples: [sample], followersAtStart: null };
  }
  const last = series.samples.at(-1);
  if (last && at - last.at < MIN_GAP_MS) return series;
  return { ...series, samples: [...series.samples, sample] };
}

export const peakViewers = (series: ViewerSeries): number =>
  Math.max(0, ...series.samples.map((s) => s.viewers));
