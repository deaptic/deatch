import { For, Show, type JSX } from "solid-js";
import Toolbar from "../ui/Toolbar.tsx";
import ToolbarItem from "../ui/ToolbarItem.tsx";

export type RichNoticeAction = {
  title: string;
  icon: () => JSX.Element;
  onClick: () => void;
  variant?: "default" | "success" | "danger";
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
      <div class={props.class}>
        {props.label}
        <Show when={props.suffix}>
          <span class="text-text-muted"> · {props.suffix}</span>
        </Show>
      </div>
      <Show when={props.actions?.length}>
        <Toolbar alwaysVisible>
          <For each={props.actions}>
            {(action) => (
              <ToolbarItem
                title={action.title}
                variant={action.variant}
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
