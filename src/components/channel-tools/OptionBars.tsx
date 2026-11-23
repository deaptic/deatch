import { For, type JSX } from "solid-js";
import { formatWholePercent } from "../../lib/format/units.ts";
import LabeledBar from "./LabeledBar.tsx";

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
    <div class="flex flex-col gap-3">
      <For each={props.options}>
        {(o) => (
          <LabeledBar
            label={o.title}
            detail={`${o.detail} · ${formatWholePercent(share(o))}`}
            value={o.value}
            max={total()}
            tone={o.value > 0 && o.value === top() ? "accent" : "neutral"}
            action={props.action?.(o)}
          />
        )}
      </For>
    </div>
  );
}
