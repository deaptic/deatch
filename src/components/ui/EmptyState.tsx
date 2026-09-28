import { type JSX, Show } from "solid-js";

type Props = {
  icon: JSX.Element;
  title: string;
  body: string;
  action?: JSX.Element;
};

export default function EmptyState(props: Props) {
  return (
    <div class="flex flex-1 items-center justify-center p-6">
      <div class="flex flex-col items-center text-center gap-3 max-w-90">
        <span class="text-ink-faint [&>svg]:size-6">{props.icon}</span>
        <h2 class="text-title text-ink">{props.title}</h2>
        <p class="text-body text-ink-soft">{props.body}</p>
        <Show when={props.action}>
          <div class="pt-2">{props.action}</div>
        </Show>
      </div>
    </div>
  );
}
