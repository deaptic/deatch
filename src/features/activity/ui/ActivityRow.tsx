import { children, type JSX, Show } from "solid-js";

type Props = {
  icon: JSX.Element;
  title: JSX.Element;
  meta?: string;
  actions?: JSX.Element;
  children?: JSX.Element;
};

export default function ActivityRow(props: Props) {
  const body = children(() => props.children);
  const actions = children(() => props.actions);
  return (
    <div class="flex flex-col gap-2.5 px-4 py-3 text-small enter-rise">
      <div class="flex items-center gap-2.5 min-w-0 h-control-sm">
        <span class="shrink-0 text-accent-ink [&>svg]:size-4">
          {props.icon}
        </span>
        <span class="flex-1 min-w-0 truncate font-medium text-ink">
          {props.title}
        </span>
        <Show when={props.meta}>
          <span class="shrink-0 text-ink-soft tabular-nums">{props.meta}</span>
        </Show>
        <Show when={actions.toArray().length}>
          <span class="shrink-0 flex items-center gap-1.5">{actions()}</span>
        </Show>
      </div>
      <Show when={body.toArray().length}>
        <div class="pl-6.5">{body()}</div>
      </Show>
    </div>
  );
}
