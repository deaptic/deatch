// `\b` needs a word character on one side, so it never matches around terms
// like "!drop" or "gg!". These lookarounds only forbid a word character
// touching the term.
const NOT_WORD_BEFORE = "(?<!\\w)";
const NOT_WORD_AFTER = "(?!\\w)";

export type Anchor = "anywhere" | "start";

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function wordPattern(terms: string[], anchor: Anchor): string {
  const alternatives = terms.map(escapeRegExp).join("|");
  const before = anchor === "start" ? "^" : NOT_WORD_BEFORE;
  return `${before}(?:${alternatives})${NOT_WORD_AFTER}`;
}

export function matchesAnyKeyword(text: string, keywords: string[]): boolean {
  const terms = keywords.map((k) => k.trim()).filter(Boolean);
  if (terms.length === 0) return false;
  return new RegExp(wordPattern(terms, "anywhere"), "i").test(text);
}
