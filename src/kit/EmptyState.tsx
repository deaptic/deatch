import { children, type JSX, Show } from "solid-js";

type TextVariant = "inline" | "list" | "palette";

type Props =
  | {
      variant?: "page";
      icon: JSX.Element;
      title: string;
      body: string;
      action?: JSX.Element;
    }
  | { variant: TextVariant; body: string };

const TEXT: Record<TextVariant, string> = {
  inline:
    "rounded-lg bg-surface px-4 py-10 text-center text-body text-ink-soft",
  list: "py-3 text-body text-ink-faint",
  palette: "py-8 text-center text-body text-ink-soft",
};

export default function EmptyState(props: Props) {
  if (props.variant && props.variant !== "page") {
    return <p class={TEXT[props.variant]}>{props.body}</p>;
  }
  const page = props as Extract<Props, { icon: JSX.Element }>;
  const action = children(() => page.action);
  return (
    <div class="flex flex-1 items-center justify-center p-6">
      <div class="flex flex-col items-center text-center gap-3 max-w-90 enter-rise">
        <span class="text-ink-faint [&>svg]:size-6">{page.icon}</span>
        <h2 class="text-title text-ink">{page.title}</h2>
        <p class="text-body text-ink-soft">{page.body}</p>
        <Show when={action.toArray().length}>
          <div class="pt-2">{action()}</div>
        </Show>
      </div>
    </div>
  );
}
