import { For, type JSX, Show } from "solid-js";
import Toolbar from "../ui/Toolbar.tsx";
import ToolbarItem, { type ToolbarTone } from "../ui/ToolbarItem.tsx";

export type RichNoticeAction = {
  title: string;
  icon: () => JSX.Element;
  onClick: () => void;
  tone?: ToolbarTone;
  disabled?: () => boolean;
};

type Props = {
  label: string;
  class: string;
  actions?: RichNoticeAction[];
  suffix?: string;
};

export default function RichNotice(props: Props) {
  return (
    <>
      <div
        class={`feed-meta leading-tight font-semibold mb-0.5 wrap-break-word ${props.class}`}
      >
        {props.label}
        <Show when={props.suffix}>
          <span class="text-ink-soft font-medium">{` · ${props.suffix}`}</span>
        </Show>
      </div>
      <Show when={props.actions?.length}>
        <Toolbar alwaysVisible>
          <For each={props.actions}>
            {(action) => (
              <ToolbarItem
                title={action.title}
                tone={action.tone}
                disabled={action.disabled?.()}
                onClick={action.onClick}
              >
                {action.icon()}
              </ToolbarItem>
            )}
          </For>
        </Toolbar>
      </Show>
    </>
  );
}
