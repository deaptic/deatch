import { type JSX, Show, useContext } from "solid-js";
import { matchesQuery } from "../../lib/utils/textQuery.ts";
import { SettingsQuery } from "./settingsQuery.ts";

type Props = {
  label: string;
  description?: string;
  stacked?: boolean;
  children: JSX.Element;
};

export default function SettingsRow(props: Props) {
  const query = useContext(SettingsQuery);

  return (
    <Show when={matchesQuery(query(), props.label, props.description)}>
      <div
        data-match
        class={`flex gap-x-6 gap-y-3 px-5 py-3 min-h-16 ${
          props.stacked
            ? "flex-col items-stretch"
            : "flex-wrap items-center justify-between"
        }`}
      >
        <div
          class={`flex flex-col min-w-0 ${
            props.stacked ? "" : "flex-1 basis-56"
          }`}
        >
          <span class="text-body font-semibold text-ink">{props.label}</span>
          <Show when={props.description}>
            <span class="text-small text-ink-soft mt-0.5">
              {props.description}
            </span>
          </Show>
        </div>
        <div class={props.stacked ? "flex flex-col gap-2" : "shrink-0"}>
          {props.children}
        </div>
      </div>
    </Show>
  );
}
