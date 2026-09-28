import { type JSX, Show } from "solid-js";

type Props = {
  title?: string;
  lede?: string;
  children: JSX.Element;
};

export default function PageBody(props: Props) {
  return (
    <div class="flex-1 min-h-0 overflow-y-auto">
      <div class="w-full max-w-260 mx-auto px-5 pt-6 pb-12 flex flex-col gap-4">
        <Show when={props.title}>
          <header class="flex flex-col gap-1 mb-2">
            <h2 class="text-heading text-ink">{props.title}</h2>
            <Show when={props.lede}>
              <p class="text-body text-ink-soft max-w-prose">{props.lede}</p>
            </Show>
          </header>
        </Show>
        {props.children}
      </div>
    </div>
  );
}
