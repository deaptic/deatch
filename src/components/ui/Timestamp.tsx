import { Time, type TimeFormat } from "../../lib/utils/time.ts";

type Props = {
  ts: string | number;
  format?: TimeFormat;
  class?: string;
};

export default function Timestamp(props: Props) {
  return (
    <span class={`tabular-nums ${props.class ?? ""}`}>
      {new Time(props.ts, props.format ?? "t").toString()}
    </span>
  );
}
