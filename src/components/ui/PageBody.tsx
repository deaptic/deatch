import { type JSX, Show, useContext } from "solid-js";
import { SettingsQuery } from "./settingsQuery.ts";

type Props = {
  title?: string;
  lede?: string;
  children: JSX.Element;
};

export default function PageBody(props: Props) {
  const query = useContext(SettingsQuery);

  return (
    <Show
      when={!query().trim()}
      fallback={
        <section class="flex flex-col gap-3 not-has-data-match:hidden">
          <h2 class="text-title text-ink-soft">{props.title}</h2>
          {props.children}
        </section>
      }
    >
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
    </Show>
  );
}
