export type Segment =
  | { kind: "text"; text: string }
  | { kind: "emote"; name: string; url: string }
  | { kind: "link"; url: string };

const URL_RE = /^https?:\/\/\S+$/;

export const linksIn = (text: string): string[] =>
  text.split(/\s+/).filter((token) => URL_RE.test(token));

export function textSegments(
  text: string,
  emotes: Record<string, string>,
): Segment[] {
  const segments: Segment[] = [];
  let plain = "";
  for (const token of text.split(/(\s+)/)) {
    const emote = emotes[token];
    const isLink = !emote && URL_RE.test(token);
    if (!emote && !isLink) {
      plain += token;
      continue;
    }
    if (plain) segments.push({ kind: "text", text: plain });
    plain = "";
    segments.push(
      emote
        ? { kind: "emote", name: token, url: emote }
        : { kind: "link", url: token },
    );
  }
  if (plain) segments.push({ kind: "text", text: plain });
  return segments;
}
