import { Time, type TimeFormat } from "../../lib/utils/time.ts";

type Props = {
  ts: string | number;
  format?: TimeFormat;
  feed?: boolean;
};

export default function Timestamp(props: Props) {
  return (
    <span
      class={`tabular-nums ${
        props.feed
          ? "feed-timestamp shrink-0 mr-2.5 text-ink-soft select-none"
          : ""
      }`}
    >
      {new Time(props.ts, props.format ?? "t").toString()}
    </span>
  );
}
