import { expect, test } from "vite-plus/test";
import { formatMoney } from "./currency.ts";

test("scales the value by its decimal places", () => {
  expect(formatMoney({ value: 1050, decimalPlaces: 2, currency: "USD" })).toBe(
    "US$10.50",
  );
  expect(formatMoney({ value: 500, decimalPlaces: 0, currency: "EUR" })).toBe(
    "€500.00",
  );
});

test("keeps the currency's own fraction digits", () => {
  expect(formatMoney({ value: 1200, decimalPlaces: 0, currency: "JPY" })).toBe(
    "JP¥1,200",
  );
});
