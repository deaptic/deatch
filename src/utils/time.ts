export type TimeFormat = "t" | "T" | "d" | "D" | "f" | "F" | "r" | "R";

export class Time {
  private static readonly UNITS = ["years", "months", "days", "hours", "minutes"] as const;

  readonly date: Date;
  readonly locale: string = "en-GB";

  constructor(
    input: number | string | Date,
    public format: TimeFormat = "f",
  ) {
    this.date = input instanceof Date ? input : new Date(input);
  }

  private timeShort(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  private timeLong(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  }

  private dateShort(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  private dateLong(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  private dateTimeShort(date: Date): string {
    return `${this.dateLong(date)} at ${this.timeShort(date)}`;
  }

  private dateTimeLong(date: Date): string {
    const weekdayDate = new Intl.DateTimeFormat(this.locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    return `${weekdayDate} at ${this.timeShort(date)}`;
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
    return dur.sign < 0 ? `${formatted} ago` : `in ${formatted}`;
  }

  private duration(date: Date): Temporal.Duration {
    const tz = Temporal.Now.timeZoneId();
    return Temporal.Instant.fromEpochMilliseconds(date.getTime())
      .toZonedDateTimeISO(tz)
      .since(Temporal.Now.zonedDateTimeISO(tz), { largestUnit: "year" });
  }

  toString(): string {
    const collection = {
      t: this.timeShort(this.date),
      T: this.timeLong(this.date),
      d: this.dateShort(this.date),
      D: this.dateLong(this.date),
      f: this.dateTimeShort(this.date),
      F: this.dateTimeLong(this.date),
      r: this.relativeShort(this.date),
      R: this.relativeLong(this.date),
    };
    return collection[this.format];
  }
}
