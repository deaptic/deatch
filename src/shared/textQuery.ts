export function matchesQuery(
  query: string,
  ...texts: (string | undefined)[]
): boolean {
  const needle = query.trim().toLowerCase();
  return !needle || texts.some((text) => text?.toLowerCase().includes(needle));
}
