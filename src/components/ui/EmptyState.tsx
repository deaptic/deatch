import { children, type JSX, Show } from "solid-js";

type Props =
  | {
      variant?: "page";
      icon: JSX.Element;
      title: string;
      body: string;
      action?: JSX.Element;
    }
  | { variant: "inline"; body: string };

export default function EmptyState(props: Props) {
  if (props.variant === "inline") {
    return (
      <p class="rounded-lg bg-surface px-4 py-10 text-center text-body text-ink-soft">
        {props.body}
      </p>
    );
  }
  const action = children(() => props.action);
  return (
    <div class="flex flex-1 items-center justify-center p-6">
      <div class="flex flex-col items-center text-center gap-3 max-w-90 enter-rise">
        <span class="text-ink-faint [&>svg]:size-6">{props.icon}</span>
        <h2 class="text-title text-ink">{props.title}</h2>
        <p class="text-body text-ink-soft">{props.body}</p>
        <Show when={action.toArray().length}>
          <div class="pt-2">{action()}</div>
        </Show>
      </div>
    </div>
  );
}
