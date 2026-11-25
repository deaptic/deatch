import { type JSX, Show, useContext } from "solid-js";
import { matchesQuery } from "../shared/textQuery.ts";
import { FilterQuery } from "./filterQuery.ts";

type Props = {
  label: string;
  description?: string;
  keywords?: string[];
  layout?: "inline" | "stacked";
  children?: JSX.Element;
};

export default function FormRow(props: Props) {
  const stacked = () => props.layout === "stacked";
  const query = useContext(FilterQuery);

  return (
    <Show
      when={matchesQuery(
        query(),
        props.label,
        props.description,
        ...(props.keywords ?? []),
      )}
    >
      <div
        data-match
        class={`flex gap-x-6 gap-y-2 px-4 py-2.5 min-h-12 ${
          stacked()
            ? "flex-col items-stretch"
            : "flex-wrap items-center justify-between"
        }`}
      >
        <div
          class={`flex flex-col min-w-0 ${stacked() ? "" : "flex-1 basis-56"}`}
        >
          <span class="text-base font-semibold text-ink">{props.label}</span>
          <Show when={props.description}>
            <span class="text-sm text-ink-soft mt-0.5">
              {props.description}
            </span>
          </Show>
        </div>
        <div class={stacked() ? "flex flex-col gap-2" : "shrink-0"}>
          {props.children}
        </div>
      </div>
    </Show>
  );
}
