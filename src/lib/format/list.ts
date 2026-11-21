import { formatLocale } from "../i18n/index.ts";

export function formatList(items: string[]): string {
  return new Intl.ListFormat(formatLocale()).format(items);
}

export function formatAlternatives(items: string[]): string {
  return new Intl.ListFormat(formatLocale(), { type: "disjunction" }).format(
    items,
  );
}
