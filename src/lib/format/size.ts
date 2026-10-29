import { t } from "../i18n/index.ts";

const UNITS = ["b", "kb", "mb", "gb"] as const;

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit >= 3 && value < 10 ? 1 : 0;
  return t("FORMAT_BYTES", {
    value: Number(value.toFixed(digits)),
    unit: UNITS[unit] ?? "gb",
  });
}
