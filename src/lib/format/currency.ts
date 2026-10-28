import { formatLocale } from "../i18n/index.ts";
import type { RawAmount } from "../types/index.ts";

export function formatAmount(amount: RawAmount): string {
  return new Intl.NumberFormat(formatLocale(), {
    style: "currency",
    currency: amount.currency,
  }).format(amount.value / 10 ** amount.decimal_place);
}
