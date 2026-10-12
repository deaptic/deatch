import { createSignal, onCleanup, Show } from "solid-js";
import { Time, type TimeFormat } from "../../lib/utils/time.ts";
import Tooltip from "./Tooltip.tsx";

const TOOLTIP_DELAY_MS = 300;

type Variant = "plain" | "column" | "gutter" | "inline";

const VARIANTS: Record<Variant, string> = {
  plain: "",
  column: "feed-timestamp shrink-0 mr-2.5 text-ink-soft select-none",
  gutter:
    "feed-timestamp whitespace-nowrap text-ink-faint select-none invisible group-hover:visible",
  inline: "feed-timestamp ml-2 text-ink-faint select-none",
};

type Props = {
  ts: string | number;
  format?: TimeFormat;
  variant?: Variant;
};

export default function Timestamp(props: Props) {
  const [tip, setTip] = createSignal<{ x: number; y: number } | null>(null);
  let timer: number | undefined;

  function hide() {
    clearTimeout(timer);
    setTip(null);
  }

  function show(el: HTMLElement) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const r = el.getBoundingClientRect();
      setTip({ x: r.left + r.width / 2, y: r.top - 8 });
    }, TOOLTIP_DELAY_MS);
  }

  onCleanup(hide);

  return (
    <>
      <span
        class={`tabular-nums ${VARIANTS[props.variant ?? "plain"]}`}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={hide}
      >
        {new Time(props.ts, props.format ?? "t").toString()}
      </span>
      <Show when={tip()}>
        {(t) => (
          <Tooltip x={t().x} y={t().y} placement="above">
            {new Time(props.ts, "F").toString()}
          </Tooltip>
        )}
      </Show>
    </>
  );
}
