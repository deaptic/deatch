import { For, type JSX, Show } from "solid-js";
import { formatWholePercent } from "../../lib/format/units.ts";
import Meter from "../ui/Meter.tsx";

export type BarOption = {
  id: string;
  title: string;
  value: number;
  detail: string;
};

type Props = {
  options: BarOption[];
  action?: (option: BarOption) => JSX.Element;
};

export default function OptionBars(props: Props) {
  const total = () => props.options.reduce((sum, o) => sum + o.value, 0);
  const top = () => Math.max(0, ...props.options.map((o) => o.value));
  const share = (o: BarOption) => (total() > 0 ? (o.value / total()) * 100 : 0);

  return (
    <div
      class={`grid items-center gap-x-3 gap-y-2 ${
        props.action ? "grid-options-action" : "grid-options"
      }`}
    >
      <For each={props.options}>
        {(o) => (
          <>
            <span class="truncate text-ink">{o.title}</span>
            <Meter
              value={o.value}
              max={total()}
              label={o.title}
              tone={o.value > 0 && o.value === top() ? "accent" : "neutral"}
            />
            <span class="text-right text-ink-soft tabular-nums">
              {o.detail} · {formatWholePercent(share(o))}
            </span>
            <Show when={props.action}>{(action) => action()(o)}</Show>
          </>
        )}
      </For>
    </div>
  );
}
