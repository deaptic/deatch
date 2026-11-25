import { type JSX, Show, useContext } from "solid-js";
import { FilterQuery } from "./filterQuery.ts";

type Props = {
  title?: string;
  children: JSX.Element;
};

export default function Page(props: Props) {
  const query = useContext(FilterQuery);

  return (
    <Show
      when={!query().trim()}
      fallback={
        <section class="flex flex-col gap-3 not-has-data-match:hidden">
          <h2 class="text-base font-semibold text-ink-soft">{props.title}</h2>
          {props.children}
        </section>
      }
    >
      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="w-full max-w-180 mx-auto px-5 pt-5 pb-12 flex flex-col gap-3">
          {props.children}
        </div>
      </div>
    </Show>
  );
}
