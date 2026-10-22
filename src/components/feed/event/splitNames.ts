/// A notice's text cut into plain runs and the people named in it, so each
/// name can render as a link. Twitch's text may change a name's case.
export type Segment = { text: string } | { text: string; person: number };

export function splitNames(text: string, names: string[]): Segment[] {
  // Longest first, so "Foo_Bar" wins over "Foo" where both would match.
  const wanted = names
    .map((name, person) => ({ name, person }))
    .filter(({ name }) => name)
    .sort((a, b) => b.name.length - a.name.length);
  if (!wanted.length) return [{ text }];
  const pattern = wanted
    .map(({ name }) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const matcher = new RegExp(`(?<![\\w])(?:${pattern})(?![\\w])`, "gi");
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(matcher)) {
    const found = wanted.find(({ name }) =>
      name.toLowerCase() === match[0].toLowerCase()
    )!;
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index) });
    }
    segments.push({ text: match[0], person: found.person });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
