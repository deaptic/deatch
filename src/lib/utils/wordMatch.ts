// `\b` needs a word character on one side, so it never matches around terms
// like "!drop" or "gg!". These lookarounds only forbid a word character
// touching the term.
const NOT_WORD_BEFORE = "(?<!\\w)";
const NOT_WORD_AFTER = "(?!\\w)";
const WILDCARD = "\\w*";
const CACHE_LIMIT = 256;

export type Anchor = "anywhere" | "start" | "exact";

const compiled = new Map<string, RegExp>();

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function termPattern(term: string): string {
  return term.split("*").map(escapeRegExp).join(WILDCARD);
}

export function wordPattern(terms: string[], anchor: Anchor): string {
  const alternatives = terms.map(termPattern).join("|");
  switch (anchor) {
    case "anywhere":
      return `${NOT_WORD_BEFORE}(?:${alternatives})${NOT_WORD_AFTER}`;
    case "start":
      return `^(?:${alternatives})${NOT_WORD_AFTER}`;
    case "exact":
      return `^(?:${alternatives})$`;
  }
}

export function matchesTerms(
  text: string,
  terms: string[],
  anchor: Anchor,
  caseSensitive = false,
): boolean {
  const usable = terms.map((t) => t.trim()).filter(hasLiteral);
  if (usable.length === 0) return false;
  return regExp(wordPattern(usable, anchor), caseSensitive ? "" : "i")
    .test(text);
}

export function matchesAnyKeyword(text: string, keywords: string[]): boolean {
  return matchesTerms(text, keywords, "anywhere");
}

// A term made only of wildcards would match every message.
function hasLiteral(term: string): boolean {
  return term.replaceAll("*", "") !== "";
}

function regExp(pattern: string, flags: string): RegExp {
  const key = `${flags}/${pattern}`;
  let re = compiled.get(key);
  if (!re) {
    if (compiled.size >= CACHE_LIMIT) compiled.clear();
    re = new RegExp(pattern, flags);
    compiled.set(key, re);
  }
  return re;
}
