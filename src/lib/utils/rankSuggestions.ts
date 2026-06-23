type RankOptions<T> = {
  keys: (item: T) => string[];
  compare: (a: T, b: T) => number;
  limit?: number;
};

export function rankSuggestions<T>(
  items: Iterable<T>,
  query: string,
  opts: RankOptions<T>,
): T[] {
  const lower = query.toLowerCase();
  const starts: T[] = [];
  const contains: T[] = [];
  for (const item of items) {
    const keys = opts.keys(item);
    if (lower === "" || keys.some((k) => k.startsWith(lower))) {
      starts.push(item);
    } else if (keys.some((k) => k.includes(lower))) contains.push(item);
  }
  starts.sort(opts.compare);
  contains.sort(opts.compare);
  const ranked = [...starts, ...contains];
  return opts.limit === undefined ? ranked : ranked.slice(0, opts.limit);
}
