const LOCALE = "en";
const OTHER = "other";

const names = new Intl.DisplayNames([LOCALE], { type: "language" });

export function languageName(code: string): string {
  if (code === OTHER) return "Other";
  try {
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

const known = new Intl.DisplayNames([LOCALE], {
  type: "language",
  fallback: "none",
});
const LETTERS = "abcdefghijklmnopqrstuvwxyz";
let everyLanguage: string[] | undefined;

export function allLanguages(): string[] {
  if (everyLanguage) return everyLanguage;
  const codes: string[] = [];
  for (const a of LETTERS) {
    for (const b of LETTERS) {
      const code = a + b;
      if (known.of(code) && Intl.getCanonicalLocales(code)[0] === code) {
        codes.push(code);
      }
    }
  }
  return everyLanguage = codes;
}

function matchRank(code: string, query: string): number {
  const name = languageName(code).toLowerCase();
  if (code === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.includes(query)) return 2;
  return -1;
}

export function searchLanguages(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allLanguages()
    .map((code) => ({ code, rank: matchRank(code, q) }))
    .filter((m) => m.rank >= 0)
    .sort((a, b) =>
      a.rank - b.rank ||
      languageName(a.code).localeCompare(languageName(b.code), LOCALE)
    )
    .map((m) => m.code);
}

export function orderLanguages(
  seen: Iterable<string>,
  pinned: readonly string[],
): string[] {
  const first = [...new Set(pinned.filter(Boolean))];
  const rest = [...new Set(seen)]
    .filter((code) => code && !first.includes(code))
    .sort((a, b) => languageName(a).localeCompare(languageName(b), LOCALE));
  return [...first, ...rest];
}
