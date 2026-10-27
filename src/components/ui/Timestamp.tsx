import { Time, type TimeFormat } from "../../lib/utils/time.ts";

type Variant = "plain" | "column" | "gutter" | "inline";

const VARIANTS: Record<Variant, string> = {
  plain: "",
  column:
    "text-feed-timestamp pt-feed-timestamp-nudge shrink-0 mr-2.5 text-ink-soft select-none",
  gutter:
    "text-feed-timestamp pt-feed-timestamp-nudge whitespace-nowrap text-ink-faint select-none invisible group-hover:visible",
  inline:
    "text-feed-timestamp pt-feed-timestamp-nudge ml-2 text-ink-faint select-none",
};

type Props = {
  ts: string | number;
  format?: TimeFormat;
  variant?: Variant;
};

export default function Timestamp(props: Props) {
  return (
    <span
      class={`tabular-nums ${VARIANTS[props.variant ?? "plain"]}`}
      data-tip={new Time(props.ts, "F").toString()}
    >
      {new Time(props.ts, props.format ?? "t").toString()}
    </span>
  );
}
