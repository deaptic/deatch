import { createSignal } from "solid-js";
import { formatLocale, t } from "./i18n/index.ts";

export const CLOCKS = ["auto", "12h", "24h"] as const;
export type Clock = (typeof CLOCKS)[number];

const [clock, setClock] = createSignal<Clock>("auto");
export { setClock };

const HOUR_CYCLES: Record<Clock, Intl.DateTimeFormatOptions> = {
  auto: {},
  "12h": { hourCycle: "h12" },
  "24h": { hourCycle: "h23" },
};

const dateFormats = new Map<string, Intl.DateTimeFormat>();

export function dateFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = dateFormats.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    dateFormats.set(key, format);
  }
  return format;
}

export type TimeFormat = "t" | "T" | "d" | "D" | "f" | "F" | "r" | "R" | "c";

export class Time {
  private static readonly UNITS = [
    "years",
    "months",
    "days",
    "hours",
    "minutes",
  ] as const;

  readonly date: Date;
  readonly locale = formatLocale();
  readonly hours = HOUR_CYCLES[clock()];

  constructor(
    input: number | string | Date,
    public format: TimeFormat = "f",
  ) {
    this.date = input instanceof Date ? input : new Date(input);
  }

  private timeShort(date: Date): string {
    return dateFormat(this.locale, {
      timeStyle: "short",
      ...this.hours,
    }).format(date);
  }

  private timeLong(date: Date): string {
    return dateFormat(this.locale, {
      timeStyle: "medium",
      ...this.hours,
    }).format(date);
  }

  private dateShort(date: Date): string {
    return dateFormat(this.locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  private dateLong(date: Date): string {
    return dateFormat(this.locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  private dateTimeShort(date: Date): string {
    return t("TIME_DATE_AT_VALUE", {
      date: this.dateLong(date),
      time: this.timeShort(date),
    });
  }

  private dateTimeLong(date: Date): string {
    const weekdayDate = dateFormat(this.locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    return `${weekdayDate}\n${this.timeShort(date)}`;
  }

  private relativeShort(date: Date): string {
    const dur = this.duration(date);
    const unit = Time.UNITS.find((name) => dur[name] !== 0);
    return new Intl.RelativeTimeFormat(this.locale, { numeric: "auto" }).format(
      unit ? dur[unit] : 0,
      unit ?? "second",
    );
  }

  private relativeLong(date: Date): string {
    const dur = this.duration(date);
    const partial = Object.fromEntries(
      Time.UNITS.filter((name) => dur[name] !== 0)
        .slice(0, 3)
        .map((name) => [name, Math.abs(dur[name])]),
    );
    if (Object.keys(partial).length === 0) return this.relativeShort(date);
    const formatted = new Intl.DurationFormat(this.locale, {
      style: "long",
    }).format(partial);
    return t("TIME_RELATIVE_VALUE", {
      direction: dur.sign < 0 ? "past" : "future",
      duration: formatted,
    });
  }

  private duration(date: Date): Temporal.Duration {
    const tz = Temporal.Now.timeZoneId();
    return Temporal.Instant.fromEpochMilliseconds(date.getTime())
      .toZonedDateTimeISO(tz)
      .since(Temporal.Now.zonedDateTimeISO(tz), { largestUnit: "year" });
  }

  private calendar(date: Date): string {
    const days = daysBetween(date, new Date());
    if (days === 0) return this.timeShort(date);
    if (days === 1) {
      return t("TIME_YESTERDAY_AT_VALUE", { time: this.timeShort(date) });
    }
    return t("TIME_DATE_TIME_VALUE", {
      date: this.dateShort(date),
      time: this.timeShort(date),
    });
  }

  toString(): string {
    const formatters: Record<TimeFormat, (date: Date) => string> = {
      t: (d) => this.timeShort(d),
      T: (d) => this.timeLong(d),
      d: (d) => this.dateShort(d),
      D: (d) => this.dateLong(d),
      f: (d) => this.dateTimeShort(d),
      F: (d) => this.dateTimeLong(d),
      r: (d) => this.relativeShort(d),
      R: (d) => this.relativeLong(d),
      c: (d) => this.calendar(d),
    };
    return formatters[this.format](this.date);
  }
}

export function startOfDay(input: number | Date): number {
  const d = new Date(input);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function daysBetween(from: number | Date, to: number | Date): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}
