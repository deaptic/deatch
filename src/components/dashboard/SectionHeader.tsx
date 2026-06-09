import { type JSX, Show } from "solid-js";

type Props = {
  title: string;
  count?: number;
  children?: JSX.Element;
};

export default function SectionHeader(props: Props) {
  return (
    <div class="mb-3.5 flex items-center gap-2.5">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-text">
        {props.title}
      </h2>
      <Show when={props.count}>
        <span class="rounded-full bg-bg px-2 py-0.5 text-xs text-text-muted">
          {props.count}
        </span>
      </Show>
      <Show when={props.children}>
        <div class="ml-auto flex items-center gap-1">{props.children}</div>
      </Show>
    </div>
  );
}
