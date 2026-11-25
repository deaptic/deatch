import { type JSX, Show } from "solid-js";

type Props = {
  title: string;
  count?: string | number;
  inset?: boolean;
  actions?: JSX.Element;
};

export default function PanelHeader(props: Props) {
  return (
    <header
      class={`flex items-center gap-2 ${
        props.inset ? "h-header shrink-0 pl-5 pr-3" : ""
      }`}
    >
      <h2 class="text-base font-semibold text-ink">{props.title}</h2>
      <span class="flex-1 text-base text-ink-faint tabular-nums">
        <Show when={props.count !== undefined}>{props.count}</Show>
      </span>
      {props.actions}
    </header>
  );
}
