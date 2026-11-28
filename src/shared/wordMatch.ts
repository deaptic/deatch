import { escapeRegExp } from "./regExp.ts";

const NOT_WORD_BEFORE = "(?<!\\S)";
const NOT_WORD_AFTER = "(?!\\S)";
const WILDCARD = "\\S*";
const CACHE_LIMIT = 256;

export type Anchor = "anywhere" | "start" | "exact";

const compiled = new Map<string, RegExp>();

function termPattern(term: string): string {
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

function firstMatch(
  text: string,
  terms: string[],
  anchor: Anchor,
  caseSensitive: boolean,
): RegExpExecArray | null {
  const usable = terms.map((t) => t.trim()).filter(hasLiteral);
  if (usable.length === 0) return null;
  return regExp(wordPattern(usable, anchor), caseSensitive ? "" : "i").exec(
    text,
  );
}

export function matchEnd(
  text: string,
  terms: string[],
  anchor: Anchor,
  caseSensitive = false,
): number | null {
  const match = firstMatch(text, terms, anchor, caseSensitive);
  return match ? match.index + match[0].length : null;
}

export function matchedWord(text: string, keyword: string): string | null {
  return firstMatch(text, [keyword], "anywhere", false)?.[0] ?? null;
}

export function matchesTerms(
  text: string,
  terms: string[],
  anchor: Anchor,
  caseSensitive = false,
): boolean {
  return matchEnd(text, terms, anchor, caseSensitive) !== null;
}

export function matchedKeyword(
  text: string,
  keywords: string[],
): string | null {
  return keywords.find((k) => matchesTerms(text, [k], "anywhere")) ?? null;
}

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
