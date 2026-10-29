import { expect, test } from "vite-plus/test";
import { formatAmount } from "./currency.ts";

test("scales the raw value by its decimal places", () => {
  expect(formatAmount({ value: 1050, decimal_place: 2, currency: "USD" })).toBe(
    "US$10.50",
  );
  expect(formatAmount({ value: 500, decimal_place: 0, currency: "EUR" })).toBe(
    "€500.00",
  );
});

test("keeps the currency's own fraction digits", () => {
  expect(formatAmount({ value: 1200, decimal_place: 0, currency: "JPY" })).toBe(
    "JP¥1,200",
  );
});
