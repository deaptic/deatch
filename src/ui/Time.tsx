export type TimeFormat = "time" | "date" | "datetime";

const FORMATS: Record<TimeFormat, Intl.DateTimeFormatOptions> = {
  time: { hour: "2-digit", minute: "2-digit", hour12: false },
  date: { day: "numeric", month: "short", year: "numeric" },
  datetime: {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  },
};

type Props = {
  ts: string | number;
  type?: TimeFormat;
  class?: string;
};

export default function Time(props: Props) {
  return (
    <span class={`tabular-nums ${props.class ?? ""}`}>
      {new Date(props.ts).toLocaleString("en-GB", FORMATS[props.type ?? "time"])}
    </span>
  );
}
