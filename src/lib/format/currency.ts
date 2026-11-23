import { formatLocale } from "../i18n/index.ts";
import type { DonationAmount, RawAmount } from "../types/index.ts";

export function formatAmount(amount: RawAmount): string {
  return new Intl.NumberFormat(formatLocale(), {
    style: "currency",
    currency: amount.currency,
  }).format(amount.value / 10 ** amount.decimal_place);
}

export function formatDonation(amount: DonationAmount): string {
  return formatAmount({
    value: amount.value,
    decimal_place: amount.decimalPlaces,
    currency: amount.currency,
  });
}
