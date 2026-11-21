import { escapeRegExp } from "./regExp.ts";

export type Segment = { text: string } | { text: string; person: number };

export function splitNames(text: string, names: string[]): Segment[] {
  const wanted = names
    .map((name, person) => ({ name, person }))
    .filter(({ name }) => name)
    .sort((a, b) => b.name.length - a.name.length);
  if (!wanted.length) return [{ text }];
  const pattern = wanted.map(({ name }) => escapeRegExp(name)).join("|");
  const matcher = new RegExp(`(?<![\\w])(?:${pattern})(?![\\w])`, "gi");
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(matcher)) {
    const found = wanted.find(
      ({ name }) => name.toLowerCase() === match[0].toLowerCase(),
    );
    if (!found) continue;
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index) });
    }
    segments.push({ text: match[0], person: found.person });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
