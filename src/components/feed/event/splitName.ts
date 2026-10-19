/// Finds a chatter's name as a whole word in an event's text, so it can be
/// rendered as a name link. Twitch's text may change the name's case.
export function splitName(
  text: string,
  name: string,
): { before: string; name: string; after: string } | null {
  if (!name) return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "i").exec(text);
  if (!match) return null;
  const end = match.index + match[0].length;
  return {
    before: text.slice(0, match.index),
    name: match[0],
    after: text.slice(end),
  };
}
