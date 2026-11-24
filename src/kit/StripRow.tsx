import { children, type JSX, Show } from "solid-js";

type Tone = "plain" | "accent";

const TONES: Record<
  Tone,
  { row: string; icon: string; title: string; meta: string }
> = {
  plain: {
    row: "",
    icon: "text-accent-ink",
    title: "text-ink",
    meta: "text-ink-soft",
  },
  accent: {
    row: "bg-accent text-on-accent",
    icon: "text-on-accent",
    title: "text-on-accent",
    meta: "text-on-accent/80",
  },
};

type Props = {
  tone?: Tone;
  icon: JSX.Element;
  title: JSX.Element;
  meta?: string;
  actions?: JSX.Element;
  children?: JSX.Element;
};

export default function StripRow(props: Props) {
  const tone = () => TONES[props.tone ?? "plain"];
  const body = children(() => props.children);
  const actions = children(() => props.actions);
  return (
    <div
      class={`flex flex-col gap-2.5 px-4 py-3 text-small enter-rise ${tone().row}`}
    >
      <div class="flex items-center gap-2.5 min-w-0 h-control-sm">
        <span class={`shrink-0 [&>svg]:size-4 ${tone().icon}`}>
          {props.icon}
        </span>
        <span class={`flex-1 min-w-0 truncate font-medium ${tone().title}`}>
          {props.title}
        </span>
        <Show when={props.meta}>
          <span class={`shrink-0 tabular-nums ${tone().meta}`}>
            {props.meta}
          </span>
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
