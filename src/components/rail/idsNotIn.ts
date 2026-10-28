/// The wanted ids missing from `known`, first occurrence first.
export function idsNotIn(
  known: Set<string>,
  wanted: (string | undefined)[],
): string[] {
  const ids = new Set<string>();
  for (const id of wanted) if (id && !known.has(id)) ids.add(id);
  return [...ids];
}
