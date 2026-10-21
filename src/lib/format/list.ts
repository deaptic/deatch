import { formatLocale } from "../i18n/index.ts";

/// "A, B and C" in the app locale.
export function formatList(items: string[]): string {
  return new Intl.ListFormat(formatLocale()).format(items);
}
