import { formatLocale } from "../i18n/index.ts";

export type Money = { value: number; decimalPlaces: number; currency: string };

export function formatMoney(money: Money): string {
  return new Intl.NumberFormat(formatLocale(), {
    style: "currency",
    currency: money.currency,
  }).format(money.value / 10 ** money.decimalPlaces);
}
